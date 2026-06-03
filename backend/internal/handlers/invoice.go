package handlers

import (
	"fmt"
	"net/http"
	"time"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type InvoiceHandler struct{}

func NewInvoiceHandler() *InvoiceHandler {
	return &InvoiceHandler{}
}

func (h *InvoiceHandler) List(c *gin.Context) {
	var items []models.Invoice
	q := database.DB.Order("created_at desc")

	if sid := c.Query("studentId"); sid != "" {
		q = q.Where("student_id = ?", sid)
	}
	if lid := c.Query("launchId"); lid != "" {
		q = q.Where("launch_id = ?", lid)
	}
	if status := c.Query("status"); status != "" {
		q = q.Where("status = ?", status)
	}

	var total int64
	q.Model(&models.Invoice{}).Count(&total)

	p := paginate(c)
	if err := q.
		Preload("Student").
		Preload("Student.User").
		Preload("Launch").
		Offset(p.Skip).
		Limit(p.Limit).
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoices"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"invoices": items, "total": total, "page": p.Page, "limit": p.Limit})
}

func (h *InvoiceHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var item models.Invoice
	if err := database.DB.
		Preload("Student").
		Preload("Student.User").
		Preload("Launch").
		Preload("Items").
		Preload("Items.FeeStructure").
		First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"invoice": item})
}

func (h *InvoiceHandler) StudentInvoices(c *gin.Context) {
	studentID := c.Param("id")
	var items []models.Invoice
	if err := database.DB.
		Where("student_id = ?", studentID).
		Preload("Launch").
		Preload("Items").
		Preload("Items.FeeStructure").
		Order("created_at desc").
		Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoices"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"invoices": items})
}

func (h *InvoiceHandler) Generate(c *gin.Context) {
	launchID := c.Param("id")

	var launch models.Launch
	if err := database.DB.First(&launch, launchID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Launch not found"})
		return
	}

	var classIDs []uint
	database.DB.Model(&models.Class{}).Where("launch_id = ?", launchID).Pluck("id", &classIDs)
	if len(classIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No classes in this launch"})
		return
	}

	var enrolled []models.Enrollment
	database.DB.Where("class_id IN ? AND status = ?", classIDs, "enrolled").
		Preload("Student").Find(&enrolled)

	if len(enrolled) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No enrolled students in this launch"})
		return
	}

	var feeStructures []models.FeeStructure
	database.DB.Where("(launch_id IS NULL OR launch_id = ?) AND is_mandatory = ?", launchID, true).
		Find(&feeStructures)
	if len(feeStructures) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No mandatory fee structures defined. Create fee items first."})
		return
	}

	studentMap := make(map[uint]bool)
	for _, e := range enrolled {
		studentMap[e.StudentID] = true
	}

	totalAmount := 0.0
	for _, f := range feeStructures {
		totalAmount += f.Amount
	}

	tx := database.DB.Begin()
	created := 0
	skipped := 0

	for sid := range studentMap {
		var existing int64
		tx.Model(&models.Invoice{}).Where("student_id = ? AND launch_id = ?", sid, launchID).Count(&existing)
		if existing > 0 {
			skipped++
			continue
		}

		inv := models.Invoice{
			InvoiceNo:   fmt.Sprintf("INV-%s-%d", launch.Code, sid),
			StudentID:   sid,
			LaunchID:    launch.ID,
			TotalAmount: totalAmount,
			PaidAmount:  0,
			Status:      "unpaid",
			DueDate:     time.Now().AddDate(0, 1, 0),
			IssuedAt:    time.Now(),
		}
		if err := tx.Create(&inv).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
			return
		}

		for _, f := range feeStructures {
			item := models.InvoiceItem{
				InvoiceID:      inv.ID,
				FeeStructureID: f.ID,
				Amount:         f.Amount,
			}
			if err := tx.Create(&item).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice item"})
				return
			}
		}
		created++
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{
		"message":   "Invoices generated",
		"created":   created,
		"skipped":   skipped,
		"total":     len(studentMap),
	})
}

func (h *InvoiceHandler) Pay(c *gin.Context) {
	id := c.Param("id")
	var invoice models.Invoice
	if err := database.DB.First(&invoice, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	var req struct {
		Amount        float64 `json:"amount" binding:"required"`
		PaymentMethod string  `json:"paymentMethod"`
		ReferenceNo   string  `json:"referenceNo"`
		Note          string  `json:"note"`
		PaidAt        string  `json:"paidAt"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount must be positive"})
		return
	}
	if req.Amount > (invoice.TotalAmount - invoice.PaidAmount) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount exceeds remaining balance"})
		return
	}

	paidAt := time.Now()
	if req.PaidAt != "" {
		if t, err := time.Parse(time.RFC3339, req.PaidAt); err == nil {
			paidAt = t
		}
	}

	paymentMethod := req.PaymentMethod
	if paymentMethod == "" {
		paymentMethod = "cash"
	}

	tx := database.DB.Begin()

	payment := models.Payment{
		InvoiceID:     invoice.ID,
		Amount:        req.Amount,
		PaymentMethod: paymentMethod,
		ReferenceNo:   req.ReferenceNo,
		PaidAt:        paidAt,
		Note:          req.Note,
	}
	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record payment"})
		return
	}

	newPaid := invoice.PaidAmount + req.Amount
	newStatus := "partial"
	if newPaid >= invoice.TotalAmount {
		newStatus = "paid"
	}
	if newPaid <= 0 {
		newStatus = "unpaid"
	}

	updates := map[string]interface{}{
		"paid_amount": newPaid,
		"status":      newStatus,
	}
	if newStatus == "paid" {
		updates["paid_at"] = time.Now()
	}
	tx.Model(&invoice).Updates(updates)
	tx.Commit()

	db := database.DB.Preload("Student").Preload("Student.User").Preload("Launch").First(&invoice, id)
	db.Preload("Items").Preload("Items.FeeStructure").First(&invoice, id)

	c.JSON(http.StatusOK, gin.H{"invoice": invoice, "payment": payment})
}

func (h *InvoiceHandler) Payments(c *gin.Context) {
	id := c.Param("id")
	var payments []models.Payment
	if err := database.DB.
		Where("invoice_id = ?", id).
		Order("paid_at desc").
		Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch payments"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"payments": payments})
}
