package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Email     string         `gorm:"uniqueIndex;not null;size:191" json:"email"`
	Password  string         `gorm:"not null" json:"-"`
	FullName  string         `gorm:"size:191;not null" json:"fullName"`
	Role      string         `gorm:"size:32;not null;default:student" json:"role"`
	Phone     string         `gorm:"size:32" json:"phone"`
	Address   string         `gorm:"size:255" json:"address"`
	Avatar    string         `gorm:"size:255" json:"avatar"`
	IsActive  bool           `gorm:"default:true" json:"isActive"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type Student struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"uniqueIndex;not null" json:"userId"`
	User         User      `gorm:"foreignKey:UserID" json:"user"`
	StudentCode  string    `gorm:"uniqueIndex;size:64;not null" json:"studentCode"`
	DateOfBirth  time.Time `json:"dateOfBirth"`
	Gender       string    `gorm:"size:16" json:"gender"`
	Enrollment   string    `gorm:"size:64" json:"enrollment"`
	Major        string    `gorm:"size:128" json:"major"`
	Year         int       `json:"year"`
	GPA          float64   `gorm:"type:decimal(4,2);default:0" json:"gpa"`
	GuardianName string    `gorm:"size:191" json:"guardianName"`
	GuardianPhone string   `gorm:"size:32" json:"guardianPhone"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Teacher struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"uniqueIndex;not null" json:"userId"`
	User        User      `gorm:"foreignKey:UserID" json:"user"`
	TeacherCode string    `gorm:"uniqueIndex;size:64;not null" json:"teacherCode"`
	DateOfBirth time.Time `json:"dateOfBirth"`
	Gender      string    `gorm:"size:16" json:"gender"`
	Department  string    `gorm:"size:128" json:"department"`
	Title       string    `gorm:"size:64" json:"title"`
	Specialty   string    `gorm:"size:255" json:"specialty"`
	HireDate    time.Time `json:"hireDate"`
	Salary      float64   `gorm:"type:decimal(12,2)" json:"salary"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Launch struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:128;not null" json:"name"`
	Code      string    `gorm:"uniqueIndex;size:64;not null" json:"code"`
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
	IsActive  bool      `gorm:"default:false" json:"isActive"`
	Description string  `gorm:"type:text" json:"description"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Course struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:191;not null" json:"name"`
	Code        string    `gorm:"uniqueIndex;size:64;not null" json:"code"`
	Description string    `gorm:"type:text" json:"description"`
	Credit      int       `gorm:"default:3" json:"credit"`
	Hours       int       `gorm:"default:45" json:"hours"`
	Department  string    `gorm:"size:128" json:"department"`
	IsActive    bool      `gorm:"default:true" json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Class struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Name       string    `gorm:"size:128;not null" json:"name"`
	Code       string    `gorm:"uniqueIndex;size:64;not null" json:"code"`
	CourseID   uint      `gorm:"not null" json:"courseId"`
	Course     Course    `gorm:"foreignKey:CourseID" json:"course"`
	TeacherID  uint      `json:"teacherId"`
	Teacher    Teacher   `gorm:"foreignKey:TeacherID" json:"teacher"`
	LaunchID   uint      `gorm:"not null" json:"launchId"`
	Launch     Launch    `gorm:"foreignKey:LaunchID" json:"launch"`
	Room       string    `gorm:"size:64" json:"room"`
	MaxStudent int       `gorm:"default:40" json:"maxStudent"`
	Schedule   string    `gorm:"size:255" json:"schedule"`
	Status     string    `gorm:"size:32;default:open" json:"status"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

type Enrollment struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"not null" json:"studentId"`
	Student   Student   `gorm:"foreignKey:StudentID" json:"student"`
	ClassID   uint      `gorm:"not null" json:"classId"`
	Class     Class     `gorm:"foreignKey:ClassID" json:"class"`
	Score     float64   `gorm:"type:decimal(5,2);default:0" json:"score"`
	Grade     string    `gorm:"size:8" json:"grade"`
	Status    string    `gorm:"size:32;default:enrolled" json:"status"`
	EnrolledAt time.Time `json:"enrolledAt"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Attendance struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	StudentID uint      `gorm:"not null;index:idx_attendance_student_class_date" json:"studentId"`
	Student   Student   `gorm:"foreignKey:StudentID" json:"student"`
	ClassID   uint      `gorm:"not null;index:idx_attendance_student_class_date" json:"classId"`
	Class     Class     `gorm:"foreignKey:ClassID" json:"class"`
	Date      time.Time `gorm:"not null;index:idx_attendance_student_class_date" json:"date"`
	Status    string    `gorm:"size:16;not null;default:present" json:"status"`
	Note      string    `gorm:"size:255" json:"note"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
