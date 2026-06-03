package handlers

import (
	"net/http"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type CourseHandler struct{}

func NewCourseHandler() *CourseHandler {
	return &CourseHandler{}
}

func (h *CourseHandler) List(c *gin.Context) {
	var courses []models.Course
	query := database.DB.Order("created_at desc")
	if search := c.Query("search"); search != "" {
		query = query.Where("name ILIKE ? OR code ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if dept := c.Query("department"); dept != "" {
		query = query.Where("department = ?", dept)
	}
	if err := query.Find(&courses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch courses"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"courses": courses, "total": len(courses)})
}

func (h *CourseHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var course models.Course
	if err := database.DB.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"course": course})
}

type CourseRequest struct {
	Name        string `json:"name" binding:"required"`
	Code        string `json:"code" binding:"required"`
	Description string `json:"description"`
	Credit      int    `json:"credit"`
	Hours       int    `json:"hours"`
	Department  string `json:"department"`
	IsActive    *bool  `json:"isActive"`
}

func (h *CourseHandler) Create(c *gin.Context) {
	var req CourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	course := models.Course{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Credit:      req.Credit,
		Hours:       req.Hours,
		Department:  req.Department,
		IsActive:    isActive,
	}
	if err := database.DB.Create(&course).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code already exists or invalid data"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"course": course})
}

func (h *CourseHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var course models.Course
	if err := database.DB.First(&course, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
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
	database.DB.Model(&course).Updates(updates)
	database.DB.First(&course, id)
	c.JSON(http.StatusOK, gin.H{"course": course})
}

func (h *CourseHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Course{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete course"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Course deleted"})
}
