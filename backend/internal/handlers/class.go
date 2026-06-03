package handlers

import (
	"net/http"
	"time"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type ClassHandler struct{}

func NewClassHandler() *ClassHandler {
	return &ClassHandler{}
}

func (h *ClassHandler) List(c *gin.Context) {
	var classes []models.Class
	query := database.DB.Preload("Course").Preload("Teacher.User").Preload("Launch").Order("created_at desc")
	if launchID := c.Query("launchId"); launchID != "" {
		query = query.Where("launch_id = ?", launchID)
	}
	if courseID := c.Query("courseId"); courseID != "" {
		query = query.Where("course_id = ?", courseID)
	}
	if teacherID := c.Query("teacherId"); teacherID != "" {
		query = query.Where("teacher_id = ?", teacherID)
	}
	if err := query.Find(&classes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch classes"})
		return
	}

	type classWithCount struct {
		models.Class
		EnrolledCount int64 `json:"enrolledCount"`
	}
	results := make([]classWithCount, 0, len(classes))
	for _, cl := range classes {
		var cnt int64
		database.DB.Model(&models.Enrollment{}).Where("class_id = ? AND status = ?", cl.ID, "enrolled").Count(&cnt)
		results = append(results, classWithCount{Class: cl, EnrolledCount: cnt})
	}
	c.JSON(http.StatusOK, gin.H{"classes": results, "total": len(results)})
}

func (h *ClassHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var class models.Class
	if err := database.DB.Preload("Course").Preload("Teacher.User").Preload("Launch").First(&class, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
		return
	}
	var cnt int64
	database.DB.Model(&models.Enrollment{}).Where("class_id = ?", id).Count(&cnt)
	c.JSON(http.StatusOK, gin.H{"class": class, "enrolledCount": cnt})
}

type ClassRequest struct {
	Name       string `json:"name" binding:"required"`
	Code       string `json:"code" binding:"required"`
	CourseID   uint   `json:"courseId" binding:"required"`
	TeacherID  uint   `json:"teacherId"`
	LaunchID   uint   `json:"launchId" binding:"required"`
	Room       string `json:"room"`
	MaxStudent int    `json:"maxStudent"`
	Schedule   string `json:"schedule"`
	Status     string `json:"status"`
}

func (h *ClassHandler) Create(c *gin.Context) {
	var req ClassRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	status := req.Status
	if status == "" {
		status = "open"
	}
	class := models.Class{
		Name:       req.Name,
		Code:       req.Code,
		CourseID:   req.CourseID,
		TeacherID:  req.TeacherID,
		LaunchID:   req.LaunchID,
		Room:       req.Room,
		MaxStudent: req.MaxStudent,
		Schedule:   req.Schedule,
		Status:     status,
	}
	if err := database.DB.Create(&class).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code already exists or invalid data"})
		return
	}
	database.DB.Preload("Course").Preload("Teacher.User").Preload("Launch").First(&class, class.ID)
	c.JSON(http.StatusCreated, gin.H{"class": class})
}

func (h *ClassHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var class models.Class
	if err := database.DB.First(&class, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updates := map[string]interface{}{}
	for k, v := range req {
		updates[toSnake(k)] = v
	}
	database.DB.Model(&class).Updates(updates)
	database.DB.Preload("Course").Preload("Teacher.User").Preload("Launch").First(&class, id)
	c.JSON(http.StatusOK, gin.H{"class": class})
}

func (h *ClassHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	database.DB.Where("class_id = ?", id).Delete(&models.Enrollment{})
	if err := database.DB.Delete(&models.Class{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete class"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Class deleted"})
}

type EnrollRequest struct {
	StudentID uint `json:"studentId" binding:"required"`
}

func (h *ClassHandler) Enroll(c *gin.Context) {
	classID := c.Param("id")
	var class models.Class
	if err := database.DB.First(&class, classID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Class not found"})
		return
	}
	var req EnrollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var cnt int64
	database.DB.Model(&models.Enrollment{}).Where("class_id = ? AND status = ?", classID, "enrolled").Count(&cnt)
	if int(cnt) >= class.MaxStudent {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Class is full"})
		return
	}

	var existing models.Enrollment
	if err := database.DB.Where("student_id = ? AND class_id = ?", req.StudentID, classID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Student already enrolled"})
		return
	}

	enrollment := models.Enrollment{
		StudentID:  req.StudentID,
		ClassID:    class.ID,
		Status:     "enrolled",
		EnrolledAt: time.Now(),
	}
	database.DB.Create(&enrollment)
	c.JSON(http.StatusCreated, gin.H{"enrollment": enrollment})
}

func (h *ClassHandler) ListEnrollments(c *gin.Context) {
	classID := c.Param("id")
	var enrollments []models.Enrollment
	if err := database.DB.Preload("Student.User").Where("class_id = ?", classID).Find(&enrollments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch enrollments"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"enrollments": enrollments, "total": len(enrollments)})
}
