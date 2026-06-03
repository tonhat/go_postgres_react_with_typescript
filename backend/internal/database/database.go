package database

import (
	"fmt"
	"log"
	"time"

	"go-education-api/internal/config"
	"go-education-api/internal/models"
	"go-education-api/internal/utils"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBSSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get sql.DB: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	DB = db
	log.Println("Database connection established")
	return nil
}

func Migrate() error {
	log.Println("Running database migrations...")
	return DB.AutoMigrate(
		&models.User{},
		&models.Student{},
		&models.Teacher{},
		&models.Launch{},
		&models.Course{},
		&models.Class{},
		&models.Enrollment{},
		&models.Attendance{},
		&models.GradeRule{},
		&models.Transcript{},
		&models.FeeStructure{},
		&models.Invoice{},
		&models.InvoiceItem{},
		&models.Payment{},
	)
}

func Seed() error {
	var count int64
	DB.Model(&models.User{}).Where("email = ?", "admin@education.com").Count(&count)
	if count > 0 {
		log.Println("Seed data already exists, skipping")
		return nil
	}

	log.Println("Seeding initial data...")
	hashedPassword, err := utils.HashPassword("admin123")
	if err != nil {
		return err
	}

	admin := models.User{
		Email:     "admin@education.com",
		Password:  hashedPassword,
		FullName:  "Administrator",
		Role:      "admin",
		IsActive:  true,
	}
	if err := DB.Create(&admin).Error; err != nil {
		return err
	}

	launch := models.Launch{
		Name:      "Fall 2024",
		Code:      "FA24",
		StartDate: time.Now(),
		EndDate:   time.Now().AddDate(0, 4, 0),
		IsActive:  true,
	}
	if err := DB.Create(&launch).Error; err != nil {
		return err
	}

	seededRules := []models.GradeRule{
		{MinScore: 90, MaxScore: 100, LetterGrade: "A", GPAPoints: 4.0},
		{MinScore: 80, MaxScore: 89.99, LetterGrade: "B", GPAPoints: 3.0},
		{MinScore: 70, MaxScore: 79.99, LetterGrade: "C", GPAPoints: 2.0},
		{MinScore: 60, MaxScore: 69.99, LetterGrade: "D", GPAPoints: 1.0},
		{MinScore: 0, MaxScore: 59.99, LetterGrade: "F", GPAPoints: 0.0},
	}
	for _, rule := range seededRules {
		DB.Where("letter_grade = ? AND launch_id IS NULL", rule.LetterGrade).
			FirstOrCreate(&rule)
	}

	log.Println("Seed data created successfully")
	log.Println("Default admin: admin@education.com / admin123")
	return nil
}
