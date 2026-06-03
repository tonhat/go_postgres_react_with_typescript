package handlers

import (
	"net/http"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type FeeStructureHandler struct{}

func NewFeeStructureHandler() *FeeStructureHandler {
	return &FeeStructureHandler{}
}

func (h *FeeStructureHandler) List(c *gin.Context) {
	var items []models.FeeStructure
	q := database.DB.Order("name asc")

	launchID := c.Query("launchId")
	courseID := c.Query("courseId")
	if launchID != "" {
		q = q.Where("launch_id IS NULL OR launch_id = ?", launchID)
	}
	if courseID != "" {
		q = q.Where("course_id IS NULL OR course_id = ?", courseID)
	}

	var total int64
	q.Model(&models.FeeStructure{}).Count(&total)

	p := paginate(c)
	if err := q.Preload("Launch").Preload("Course").Offset(p.Skip).Limit(p.Limit).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch fee structures"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"feeStructures": items, "total": total, "page": p.Page, "limit": p.Limit})
}

func (h *FeeStructureHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var item models.FeeStructure
	if err := database.DB.Preload("Launch").Preload("Course").First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Fee structure not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"feeStructure": item})
}

func (h *FeeStructureHandler) Create(c *gin.Context) {
	var req models.FeeStructure
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&req).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}
	database.DB.Preload("Launch").Preload("Course").First(&req, req.ID)
	c.JSON(http.StatusCreated, gin.H{"feeStructure": req})
}

func (h *FeeStructureHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var item models.FeeStructure
	if err := database.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Fee structure not found"})
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
	database.DB.Model(&item).Updates(updates)
	database.DB.Preload("Launch").Preload("Course").First(&item, id)
	c.JSON(http.StatusOK, gin.H{"feeStructure": item})
}

func (h *FeeStructureHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.FeeStructure{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete fee structure"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Fee structure deleted"})
}
