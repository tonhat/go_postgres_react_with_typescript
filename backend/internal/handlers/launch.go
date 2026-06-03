package handlers

import (
	"net/http"
	"time"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type LaunchHandler struct{}

func NewLaunchHandler() *LaunchHandler {
	return &LaunchHandler{}
}

func (h *LaunchHandler) List(c *gin.Context) {
	var launches []models.Launch
	query := database.DB.Order("start_date desc")

	var total int64
	query.Model(&models.Launch{}).Count(&total)

	p := paginate(c)
	if err := query.Offset(p.Skip).Limit(p.Limit).Find(&launches).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch launches"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"launches": launches, "total": total, "page": p.Page, "limit": p.Limit})
}

func (h *LaunchHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var launch models.Launch
	if err := database.DB.First(&launch, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Launch not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"launch": launch})
}

type LaunchRequest struct {
	Name        string    `json:"name" binding:"required"`
	Code        string    `json:"code" binding:"required"`
	StartDate   time.Time `json:"startDate" binding:"required"`
	EndDate     time.Time `json:"endDate" binding:"required"`
	IsActive    bool      `json:"isActive"`
	Description string    `json:"description"`
}

func (h *LaunchHandler) Create(c *gin.Context) {
	var req LaunchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.IsActive {
		database.DB.Model(&models.Launch{}).Where("is_active = ?", true).Update("is_active", false)
	}

	launch := models.Launch{
		Name:        req.Name,
		Code:        req.Code,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		IsActive:    req.IsActive,
		Description: req.Description,
	}
	if err := database.DB.Create(&launch).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Code already exists or invalid data"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"launch": launch})
}

func (h *LaunchHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var launch models.Launch
	if err := database.DB.First(&launch, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Launch not found"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if isActive, ok := req["isActive"].(bool); ok && isActive {
		database.DB.Model(&models.Launch{}).Where("is_active = ? AND id <> ?", true, id).Update("is_active", false)
	}

	updates := map[string]interface{}{}
	for k, v := range req {
		updates[toSnake(k)] = v
	}
	database.DB.Model(&launch).Updates(updates)
	database.DB.First(&launch, id)
	c.JSON(http.StatusOK, gin.H{"launch": launch})
}

func (h *LaunchHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Launch{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete launch"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Launch deleted"})
}
