package handlers

import (
	"fmt"
	"net/http"
	"time"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type StudentHandler struct{}

func NewStudentHandler() *StudentHandler {
	return &StudentHandler{}
}

func (h *StudentHandler) List(c *gin.Context) {
	var students []models.Student
	query := database.DB.Preload("User").Order("created_at desc")
	if search := c.Query("search"); search != "" {
		query = query.Joins("JOIN users ON users.id = students.user_id").
			Where("users.full_name ILIKE ? OR users.email ILIKE ? OR students.student_code ILIKE ?",
				"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}
	if err := query.Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"students": students, "total": len(students)})
}

func (h *StudentHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var student models.Student
	if err := database.DB.Preload("User").First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"student": student})
}

type StudentRequest struct {
	Email         string    `json:"email" binding:"required,email"`
	Password      string    `json:"password" binding:"required,min=6"`
	FullName      string    `json:"fullName" binding:"required"`
	Phone         string    `json:"phone"`
	Address       string    `json:"address"`
	DateOfBirth   time.Time `json:"dateOfBirth"`
	Gender        string    `json:"gender"`
	Major         string    `json:"major"`
	Year          int       `json:"year"`
	GuardianName  string    `json:"guardianName"`
	GuardianPhone string    `json:"guardianPhone"`
}

func (h *StudentHandler) Create(c *gin.Context) {
	var req StudentRequest
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
		Role:     "student",
		IsActive: true,
	}
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists or invalid"})
		return
	}

	var count int64
	database.DB.Model(&models.Student{}).Count(&count)
	student := models.Student{
		UserID:        user.ID,
		StudentCode:   fmt.Sprintf("STU%06d", count+1),
		DateOfBirth:   req.DateOfBirth,
		Gender:        req.Gender,
		Enrollment:    "ENROLLED",
		Major:         req.Major,
		Year:          req.Year,
		GuardianName:  req.GuardianName,
		GuardianPhone: req.GuardianPhone,
	}
	database.DB.Create(&student)
	database.DB.Preload("User").First(&student, student.ID)
	c.JSON(http.StatusCreated, gin.H{"student": student})
}

func (h *StudentHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var student models.Student
	if err := database.DB.Preload("User").First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
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
		database.DB.Model(&student.User).Updates(userUpdates)
	}

	studentUpdates := map[string]interface{}{}
	for _, k := range []string{"dateOfBirth", "gender", "major", "year", "guardianName", "guardianPhone"} {
		if v, ok := req[k]; ok {
			studentUpdates[toSnake(k)] = v
		}
	}
	if len(studentUpdates) > 0 {
		database.DB.Model(&student).Updates(studentUpdates)
	}

	database.DB.Preload("User").First(&student, id)
	c.JSON(http.StatusOK, gin.H{"student": student})
}

func (h *StudentHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	var student models.Student
	if err := database.DB.First(&student, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}
	tx := database.DB.Begin()
	tx.Delete(&student)
	tx.Delete(&models.User{}, student.UserID)
	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Student deleted"})
}
