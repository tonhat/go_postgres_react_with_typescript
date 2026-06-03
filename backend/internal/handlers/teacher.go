package handlers

import (
	"fmt"
	"net/http"
	"time"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type TeacherHandler struct{}

func NewTeacherHandler() *TeacherHandler {
	return &TeacherHandler{}
}

func (h *TeacherHandler) List(c *gin.Context) {
	var teachers []models.Teacher
	query := database.DB.Preload("User").Order("created_at desc")
	if search := c.Query("search"); search != "" {
		query = query.Joins("JOIN users ON users.id = teachers.user_id").
			Where("users.full_name ILIKE ? OR users.email ILIKE ? OR teachers.teacher_code ILIKE ?",
				"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Model(&models.Teacher{}).Count(&total)

	p := paginate(c)
	if err := query.Offset(p.Skip).Limit(p.Limit).Find(&teachers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch teachers"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"teachers": teachers, "total": total, "page": p.Page, "limit": p.Limit})
}

func (h *TeacherHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var teacher models.Teacher
	if err := database.DB.Preload("User").First(&teacher, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Teacher not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"teacher": teacher})
}

type TeacherRequest struct {
	Email    string    `json:"email" binding:"required,email"`
	Password string    `json:"password" binding:"required,min=6"`
	FullName string    `json:"fullName" binding:"required"`
	Phone    string    `json:"phone"`
	Address  string    `json:"address"`
	DateOfBirth time.Time `json:"dateOfBirth"`
	Gender      string    `json:"gender"`
	Department  string    `json:"department"`
	Title       string    `json:"title"`
	Specialty   string    `json:"specialty"`
	HireDate    time.Time `json:"hireDate"`
	Salary      float64   `json:"salary"`
}

func (h *TeacherHandler) Create(c *gin.Context) {
	var req TeacherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, _ := hashPassword(req.Password)
	user := models.User{
		Email:    req.Email,
		Password: hashedPassword,
		FullName: req.FullName,
		Phone:    req.Phone,
		Address:  req.Address,
		Role:     "teacher",
		IsActive: true,
	}
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists or invalid"})
		return
	}

	var count int64
	database.DB.Model(&models.Teacher{}).Count(&count)
	teacher := models.Teacher{
		UserID:      user.ID,
		TeacherCode: fmt.Sprintf("TCH%06d", count+1),
		DateOfBirth: req.DateOfBirth,
		Gender:      req.Gender,
		Department:  req.Department,
		Title:       req.Title,
		Specialty:   req.Specialty,
		HireDate:    req.HireDate,
		Salary:      req.Salary,
	}
	database.DB.Create(&teacher)
	database.DB.Preload("User").First(&teacher, teacher.ID)
	c.JSON(http.StatusCreated, gin.H{"teacher": teacher})
}

func (h *TeacherHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var teacher models.Teacher
	if err := database.DB.Preload("User").First(&teacher, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Teacher not found"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userUpdates := map[string]interface{}{}
	for _, k := range []string{"fullName", "phone", "address"} {
		if v, ok := req[k]; ok {
			userUpdates[toSnake(k)] = v
		}
	}
	if len(userUpdates) > 0 {
		database.DB.Model(&teacher.User).Updates(userUpdates)
	}

	teacherUpdates := map[string]interface{}{}
	for _, k := range []string{"dateOfBirth", "gender", "department", "title", "specialty", "hireDate", "salary"} {
		if v, ok := req[k]; ok {
			teacherUpdates[toSnake(k)] = v
		}
	}
	if len(teacherUpdates) > 0 {
		database.DB.Model(&teacher).Updates(teacherUpdates)
	}

	database.DB.Preload("User").First(&teacher, id)
	c.JSON(http.StatusOK, gin.H{"teacher": teacher})
}

func (h *TeacherHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	var teacher models.Teacher
	if err := database.DB.First(&teacher, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Teacher not found"})
		return
	}
	tx := database.DB.Begin()
	tx.Delete(&teacher)
	tx.Delete(&models.User{}, teacher.UserID)
	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Teacher deleted"})
}
