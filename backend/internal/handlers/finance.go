package handlers

import (
	"net/http"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type FinanceHandler struct{}

func NewFinanceHandler() *FinanceHandler {
	return &FinanceHandler{}
}

type FinanceSummary struct {
	TotalInvoices    int64   `json:"totalInvoices"`
	TotalAmount      float64 `json:"totalAmount"`
	TotalCollected   float64 `json:"totalCollected"`
	TotalOutstanding float64 `json:"totalOutstanding"`
	PaidCount        int64   `json:"paidCount"`
	UnpaidCount      int64   `json:"unpaidCount"`
	PartialCount     int64   `json:"partialCount"`
}

func (h *FinanceHandler) Summary(c *gin.Context) {
	var summary FinanceSummary

	database.DB.Model(&models.Invoice{}).Count(&summary.TotalInvoices)

	var totalAmount float64
	database.DB.Model(&models.Invoice{}).Select("COALESCE(SUM(total_amount), 0)").Scan(&totalAmount)
	summary.TotalAmount = totalAmount

	var totalCollected float64
	database.DB.Model(&models.Invoice{}).Select("COALESCE(SUM(paid_amount), 0)").Scan(&totalCollected)
	summary.TotalCollected = totalCollected

	summary.TotalOutstanding = totalAmount - totalCollected

	database.DB.Model(&models.Invoice{}).Where("status = ?", "paid").Count(&summary.PaidCount)
	database.DB.Model(&models.Invoice{}).Where("status = ?", "unpaid").Count(&summary.UnpaidCount)
	database.DB.Model(&models.Invoice{}).Where("status = ?", "partial").Count(&summary.PartialCount)

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}

func (h *FinanceHandler) LaunchSummary(c *gin.Context) {
	launchID := c.Param("id")

	var launch models.Launch
	if err := database.DB.First(&launch, launchID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Launch not found"})
		return
	}

	var summary FinanceSummary
	database.DB.Model(&models.Invoice{}).Where("launch_id = ?", launchID).Count(&summary.TotalInvoices)

	var totalAmount float64
	database.DB.Model(&models.Invoice{}).Where("launch_id = ?", launchID).
		Select("COALESCE(SUM(total_amount), 0)").Scan(&totalAmount)
	summary.TotalAmount = totalAmount

	var totalCollected float64
	database.DB.Model(&models.Invoice{}).Where("launch_id = ?", launchID).
		Select("COALESCE(SUM(paid_amount), 0)").Scan(&totalCollected)
	summary.TotalCollected = totalCollected

	summary.TotalOutstanding = totalAmount - totalCollected

	database.DB.Model(&models.Invoice{}).Where("launch_id = ? AND status = ?", launchID, "paid").Count(&summary.PaidCount)
	database.DB.Model(&models.Invoice{}).Where("launch_id = ? AND status = ?", launchID, "unpaid").Count(&summary.UnpaidCount)
	database.DB.Model(&models.Invoice{}).Where("launch_id = ? AND status = ?", launchID, "partial").Count(&summary.PartialCount)

	c.JSON(http.StatusOK, gin.H{"summary": summary})
}
