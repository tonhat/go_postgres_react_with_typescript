package handlers

import (
	"net/http"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type GradeRuleHandler struct{}

func NewGradeRuleHandler() *GradeRuleHandler {
	return &GradeRuleHandler{}
}

func (h *GradeRuleHandler) List(c *gin.Context) {
	var rules []models.GradeRule
	q := database.DB.Order("min_score desc")

	launchID := c.Query("launchId")
	if launchID != "" {
		q = q.Where("launch_id IS NULL OR launch_id = ?", launchID)
	} else {
		q = q.Where("launch_id IS NULL")
	}

	var total int64
	q.Model(&models.GradeRule{}).Count(&total)

	p := paginate(c)
	if err := q.Preload("Launch").Offset(p.Skip).Limit(p.Limit).Find(&rules).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch grade rules"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"gradeRules": rules, "total": total, "page": p.Page, "limit": p.Limit})
}

func (h *GradeRuleHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var rule models.GradeRule
	if err := database.DB.Preload("Launch").First(&rule, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grade rule not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"gradeRule": rule})
}

func (h *GradeRuleHandler) Create(c *gin.Context) {
	var req models.GradeRule
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := database.DB.Create(&req).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid data"})
		return
	}
	database.DB.Preload("Launch").First(&req, req.ID)
	c.JSON(http.StatusCreated, gin.H{"gradeRule": req})
}

func (h *GradeRuleHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var rule models.GradeRule
	if err := database.DB.First(&rule, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Grade rule not found"})
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
	database.DB.Model(&rule).Updates(updates)
	database.DB.Preload("Launch").First(&rule, id)
	c.JSON(http.StatusOK, gin.H{"gradeRule": rule})
}

func (h *GradeRuleHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.GradeRule{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete grade rule"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Grade rule deleted"})
}
