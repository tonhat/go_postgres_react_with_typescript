package handlers

import (
	"net/http"
	"time"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type AttendanceHandler struct{}

func NewAttendanceHandler() *AttendanceHandler {
	return &AttendanceHandler{}
}

func (h *AttendanceHandler) List(c *gin.Context) {
	classID := c.Param("id")
	var records []models.Attendance
	query := database.DB.Preload("Student.User").Where("class_id = ?", classID)

	if dateStr := c.Query("date"); dateStr != "" {
		if t, err := time.Parse("2006-01-02", dateStr); err == nil {
			query = query.Where("date = ?", t)
		}
	}

	var total int64
	query.Model(&models.Attendance{}).Count(&total)

	p := paginate(c)
	if err := query.Offset(p.Skip).Limit(p.Limit).Order("date desc, student_id").Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attendance"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"attendance": records, "total": total, "page": p.Page, "limit": p.Limit})
}

type BulkAttendanceItem struct {
	StudentID uint   `json:"studentId" binding:"required"`
	Status    string `json:"status" binding:"required"`
	Note      string `json:"note"`
}

type BulkAttendanceRequest struct {
	Date   string                `json:"date" binding:"required"`
	Records []BulkAttendanceItem `json:"records" binding:"required"`
}

func (h *AttendanceHandler) MarkBulk(c *gin.Context) {
	classID := c.Param("id")

	var class models.Class
	if err := database.DB.First(&class, classID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
		return
	}

	var req BulkAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format, use YYYY-MM-DD"})
		return
	}

	validStatus := map[string]bool{"present": true, "absent": true, "late": true, "excused": true}

	for _, item := range req.Records {
		if !validStatus[item.Status] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status: " + item.Status})
			return
		}
	}

	tx := database.DB.Begin()
	for _, item := range req.Records {
		var existing models.Attendance
		result := tx.Where("student_id = ? AND class_id = ? AND date = ?", item.StudentID, classID, date).First(&existing)
		if result.Error == nil {
			tx.Model(&existing).Updates(map[string]interface{}{
				"status": item.Status,
				"note":   item.Note,
			})
		} else {
			record := models.Attendance{
				StudentID: item.StudentID,
				ClassID:   class.ID,
				Date:      date,
				Status:    item.Status,
				Note:      item.Note,
			}
			tx.Create(&record)
		}
	}
	tx.Commit()

	var records []models.Attendance
	database.DB.Preload("Student.User").Where("class_id = ? AND date = ?", classID, date).
		Order("student_id").Find(&records)
	c.JSON(http.StatusOK, gin.H{"attendance": records, "date": req.Date})
}

type AttendanceSummary struct {
	StudentID    uint    `json:"studentId"`
	StudentCode  string  `json:"studentCode"`
	FullName     string  `json:"fullName"`
	Present      int64   `json:"present"`
	Absent       int64   `json:"absent"`
	Late         int64   `json:"late"`
	Excused      int64   `json:"excused"`
	Total        int64   `json:"total"`
	Percentage   float64 `json:"percentage"`
}

func (h *AttendanceHandler) Summary(c *gin.Context) {
	classID := c.Param("id")

	var enrollments []models.Enrollment
	database.DB.Preload("Student.User").Where("class_id = ?", classID).Find(&enrollments)

	type countResult struct {
		StudentID uint
		Status    string
		Count     int64
	}
	var counts []countResult
	database.DB.Model(&models.Attendance{}).
		Select("student_id, status, count(*) as count").
		Where("class_id = ?", classID).
		Group("student_id, status").
		Scan(&counts)

	countMap := map[uint]map[string]int64{}
	for _, c := range counts {
		if countMap[c.StudentID] == nil {
			countMap[c.StudentID] = map[string]int64{}
		}
		countMap[c.StudentID][c.Status] = c.Count
	}

	results := []AttendanceSummary{}
	for _, e := range enrollments {
		stats := countMap[e.StudentID]
		present := stats["present"]
		absent := stats["absent"]
		late := stats["late"]
		excused := stats["excused"]
		total := present + absent + late + excused
		percentage := 0.0
		if total > 0 {
			percentage = float64(present+late) / float64(total) * 100
		}
		results = append(results, AttendanceSummary{
			StudentID:   e.Student.ID,
			StudentCode: e.Student.StudentCode,
			FullName:    e.Student.User.FullName,
			Present:     present,
			Absent:      absent,
			Late:        late,
			Excused:     excused,
			Total:       total,
			Percentage:  percentage,
		})
	}

	if results == nil {
		results = []AttendanceSummary{}
	}
	c.JSON(http.StatusOK, gin.H{"summary": results, "total": len(results)})
}
