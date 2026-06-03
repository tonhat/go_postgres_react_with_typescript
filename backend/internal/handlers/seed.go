package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"go-education-api/internal/database"
	"go-education-api/internal/models"
	"go-education-api/internal/utils"

	"github.com/gin-gonic/gin"
)

type SeedHandler struct{}

func NewSeedHandler() *SeedHandler {
	return &SeedHandler{}
}

func (h *SeedHandler) Demo(c *gin.Context) {
	msg := []string{}

	clean := c.Query("clean") == "true"
	if clean {
		database.DB.Exec("DELETE FROM payments")
		database.DB.Exec("DELETE FROM invoice_items")
		database.DB.Exec("DELETE FROM invoices")
		database.DB.Exec("DELETE FROM fee_structures")
		database.DB.Exec("DELETE FROM attendances")
		database.DB.Exec("DELETE FROM transcripts")
		database.DB.Exec("DELETE FROM enrollments")
		database.DB.Exec("DELETE FROM classes")
		database.DB.Exec("DELETE FROM grade_rules WHERE launch_id IS NOT NULL")
		database.DB.Exec("DELETE FROM students")
		database.DB.Exec("DELETE FROM teachers")
		database.DB.Exec("DELETE FROM courses")
		database.DB.Exec("DELETE FROM launches WHERE code != 'FA24'")
		database.DB.Exec("DELETE FROM users WHERE email != 'admin@education.com' AND role != 'admin'")
		msg = append(msg, "Cleaned existing demo data")
	}

	now := time.Now()

	// ── Teachers ──
	type teacherData struct {
		email, password, fullName, phone, code, gender, department, title, specialty string
		salary                                                                        float64
	}
	teachers := []teacherData{
		{"nguyen.van.a@school.edu", "teacher123", "Nguyễn Văn An", "0901234567", "T001", "male", "Mathematics", "Associate Professor", "Applied Mathematics", 2500},
		{"tran.thi.b@school.edu", "teacher123", "Trần Thị Bình", "0902345678", "T002", "female", "Physics", "Senior Lecturer", "Quantum Physics", 2200},
		{"le.van.c@school.edu", "teacher123", "Lê Văn Cường", "0903456789", "T003", "male", "Computer Science", "Professor", "Artificial Intelligence", 3000},
	}
	teacherIDs := []uint{}
	for _, t := range teachers {
		hp, _ := utils.HashPassword(t.password)
		u := models.User{Email: t.email, Password: hp, FullName: t.fullName, Role: "teacher", Phone: t.phone, IsActive: true}
		if err := database.DB.Where("email = ?", t.email).FirstOrCreate(&u).Error; err != nil {
			continue
		}
		dob, _ := time.Parse("2006-01-02", "1985-06-15")
		te := models.Teacher{UserID: u.ID, TeacherCode: t.code, DateOfBirth: dob, Gender: t.gender, Department: t.department, Title: t.title, Specialty: t.specialty, HireDate: now.AddDate(-5, 0, 0), Salary: t.salary}
		if err := database.DB.Where("teacher_code = ?", t.code).FirstOrCreate(&te).Error; err == nil {
			teacherIDs = append(teacherIDs, te.ID)
		}
	}
	msg = append(msg, fmt.Sprintf("Created %d teachers", len(teacherIDs)))

	// ── Students ──
	type studentData struct {
		email, password, fullName, phone, code, gender, major, guardianName, guardianPhone string
		year                                                                                int
	}
	students := []studentData{
		{"student1@school.edu", "student123", "Phạm Văn Dũng", "0911111111", "SV001", "male", "Computer Science", "Phạm Văn Hùng", "0909111111", 3},
		{"student2@school.edu", "student123", "Nguyễn Thị Em", "0922222222", "SV002", "female", "Information Technology", "Nguyễn Văn Tài", "0909222222", 3},
		{"student3@school.edu", "student123", "Trần Văn Phúc", "0933333333", "SV003", "male", "Mathematics", "Trần Thị Mai", "0909333333", 2},
		{"student4@school.edu", "student123", "Lê Thị Hoa", "0944444444", "SV004", "female", "Physics", "Lê Văn Bình", "0909444444", 2},
		{"student5@school.edu", "student123", "Hoàng Văn Giàu", "0955555555", "SV005", "male", "Computer Science", "Hoàng Thị Lan", "0909555555", 4},
		{"student6@school.edu", "student123", "Võ Thị Hạnh", "0966666666", "SV006", "female", "Information Technology", "Võ Văn Tâm", "0909666666", 3},
		{"student7@school.edu", "student123", "Đặng Văn Khải", "0977777777", "SV007", "male", "Mathematics", "Đặng Thị Nhung", "0909777777", 1},
		{"student8@school.edu", "student123", "Bùi Thị Lan", "0988888888", "SV008", "female", "Physics", "Bùi Văn Sơn", "0909888888", 1},
	}
	studentIDs := []uint{}
	for _, s := range students {
		hp, _ := utils.HashPassword(s.password)
		u := models.User{Email: s.email, Password: hp, FullName: s.fullName, Role: "student", Phone: s.phone, IsActive: true}
		if err := database.DB.Where("email = ?", s.email).FirstOrCreate(&u).Error; err != nil {
			continue
		}
		dob, _ := time.Parse("2006-01-02", fmt.Sprintf("200%d-03-15", s.year))
		st := models.Student{UserID: u.ID, StudentCode: s.code, DateOfBirth: dob, Gender: s.gender, Major: s.major, Year: s.year, GuardianName: s.guardianName, GuardianPhone: s.guardianPhone}
		if err := database.DB.Where("student_code = ?", s.code).FirstOrCreate(&st).Error; err == nil {
			studentIDs = append(studentIDs, st.ID)
		}
	}
	msg = append(msg, fmt.Sprintf("Created %d students", len(studentIDs)))

	// ── Courses ──
	type courseData struct {
		name, code, dept, desc string
		credit, hours          int
	}
	courses := []courseData{
		{"Calculus I", "MATH101", "Mathematics", "Single-variable calculus: limits, derivatives, integrals", 4, 60},
		{"Linear Algebra", "MATH201", "Mathematics", "Matrices, vector spaces, eigenvalues, linear transformations", 3, 45},
		{"Physics I", "PHY101", "Physics", "Classical mechanics: Newton's laws, energy, momentum", 4, 60},
		{"Introduction to Programming", "CS101", "Computer Science", "Fundamentals of programming using Python", 3, 45},
		{"Data Structures", "CS201", "Computer Science", "Arrays, linked lists, trees, graphs, hash tables", 3, 45},
	}
	courseIDs := []uint{}
	for _, c := range courses {
		co := models.Course{Name: c.name, Code: c.code, Department: c.dept, Description: c.desc, Credit: c.credit, Hours: c.hours, IsActive: true}
		if err := database.DB.Where("code = ?", c.code).FirstOrCreate(&co).Error; err == nil {
			courseIDs = append(courseIDs, co.ID)
		}
	}
	msg = append(msg, fmt.Sprintf("Created %d courses", len(courseIDs)))

	// ── Launches ──
	var fa24 models.Launch
	database.DB.Where("code = ?", "FA24").First(&fa24)
	if fa24.ID == 0 {
		fa24 = models.Launch{Name: "Fall 2024", Code: "FA24", StartDate: now.AddDate(0, -6, 0), EndDate: now.AddDate(0, -2, 0), IsActive: false, Description: "Fall semester 2024"}
		database.DB.Create(&fa24)
	}

	sp25 := models.Launch{Name: "Spring 2025", Code: "SP25", StartDate: now.AddDate(0, -2, 0), EndDate: now.AddDate(0, 2, 0), IsActive: true, Description: "Spring semester 2025"}
	database.DB.Where("code = ?", "SP25").FirstOrCreate(&sp25)

	launches := []models.Launch{fa24, sp25}
	msg = append(msg, fmt.Sprintf("Using %d launches (FA24, SP25)", len(launches)))

	// ── Classes ──
	type classData struct {
		name, code, room, schedule string
		courseIdx, teacherIdx      int
		maxStudent                 int
	}
	classDefs := []classData{
		{"Calculus I - A1", "MATH101-FA24-A1", "A101", "Mon/Wed 7:30-9:00", 0, 0, 50},
		{"Physics I - B1", "PHY101-FA24-B1", "B201", "Tue/Thu 9:30-11:00", 2, 1, 45},
		{"Intro to Programming - C1", "CS101-FA24-C1", "C301", "Mon/Wed 13:30-15:00", 3, 2, 60},
		{"Linear Algebra - A2", "MATH201-SP25-A2", "A102", "Tue/Thu 7:30-9:00", 1, 0, 50},
		{"Data Structures - C2", "CS201-SP25-C2", "C302", "Mon/Wed 15:30-17:00", 4, 2, 55},
		{"Physics I - B2", "PHY101-SP25-B2", "B202", "Wed/Fri 9:30-11:00", 2, 1, 45},
	}
	classIDs := []uint{}
	for i, cd := range classDefs {
		l := launches[0]
		if i >= 3 {
			l = launches[1]
		}
		if i >= len(courseIDs) || len(teacherIDs) == 0 {
			continue
		}
		ci := courseIDs[cd.courseIdx%len(courseIDs)]
		ti := teacherIDs[cd.teacherIdx%len(teacherIDs)]
		cls := models.Class{Name: cd.name, Code: cd.code, CourseID: ci, TeacherID: ti, LaunchID: l.ID, Room: cd.room, Schedule: cd.schedule, MaxStudent: cd.maxStudent, Status: "open"}
		if err := database.DB.Where("code = ?", cd.code).FirstOrCreate(&cls).Error; err == nil {
			classIDs = append(classIDs, cls.ID)
		}
	}
	msg = append(msg, fmt.Sprintf("Created %d classes", len(classIDs)))

	// ── Enrollments + Scores ──
	enrollCount := 0
	scorePatterns := []float64{95, 82, 73, 65, 88, 45, 91, 78, 69, 55, 85, 92, 70, 60, 87, 76, 58, 94, 81, 63, 90, 77, 84, 50}
	si := 0
	gradeRules := getGradeRules(0)
	for _, cid := range classIDs {
		for _, sid := range studentIDs {
			var exists int64
			database.DB.Model(&models.Enrollment{}).Where("student_id = ? AND class_id = ?", sid, cid).Count(&exists)
			if exists > 0 {
				continue
			}
			score := scorePatterns[si%len(scorePatterns)]
			grade, _ := computeGradeFromRules(score, gradeRules)
			enr := models.Enrollment{StudentID: sid, ClassID: cid, Score: score, Grade: grade, Status: "enrolled", EnrolledAt: now.AddDate(0, -3, 0)}
			if err := database.DB.Create(&enr).Error; err == nil {
				enrollCount++
			}
			si++
		}
	}
	msg = append(msg, fmt.Sprintf("Enrolled %d students with scores", enrollCount))

	// ── Attendance ──
	attCount := 0
	statuses := []string{"present", "present", "present", "present", "absent", "late", "present", "excused", "present", "present"}
	for _, cid := range classIDs {
		for d := 0; d < 10; d++ {
			date := now.AddDate(0, 0, -20+d*2)
			for _, sid := range studentIDs {
				s := statuses[(d+int(sid))%len(statuses)]
				att := models.Attendance{StudentID: sid, ClassID: cid, Date: date, Status: s}
				if err := database.DB.Where("student_id = ? AND class_id = ? AND date = ?", sid, cid, date).FirstOrCreate(&att).Error; err == nil {
					if att.ID > 0 {
						attCount++
					}
				}
			}
		}
	}
	msg = append(msg, fmt.Sprintf("Created %d attendance records", attCount))

	// ── Fee Structures ──
	feeItems := []struct {
		name        string
		amount      float64
		isMandatory bool
		launchID    *uint
	}{
		{"Tuition (per course)", 1500, true, nil},
		{"Laboratory Fee", 200, true, nil},
		{"Library Fee", 50, true, nil},
		{"Student Activity Fee", 100, true, nil},
		{"Health Insurance", 300, true, &fa24.ID},
		{"International Study Tour", 800, false, nil},
	}
	feeIDs := []uint{}
	for _, f := range feeItems {
		fee := models.FeeStructure{Name: f.name, Amount: f.amount, IsMandatory: f.isMandatory, LaunchID: f.launchID}
		if err := database.DB.Where("name = ? AND COALESCE(launch_id,0) = ?", f.name, 0).FirstOrCreate(&fee).Error; err == nil {
			feeIDs = append(feeIDs, fee.ID)
		}
	}
	msg = append(msg, fmt.Sprintf("Created %d fee structures", len(feeIDs)))

	// ── Invoices & Payments ──
	type feeAccum struct {
		total float64
	}
	invCount := 0
	payCount := 0
	for _, sid := range studentIDs {
		var mandFees []models.FeeStructure
		database.DB.Where("(launch_id IS NULL OR launch_id = ?) AND is_mandatory = ?", fa24.ID, true).Find(&mandFees)
		if len(mandFees) == 0 {
			continue
		}
		total := 0.0
		for _, mf := range mandFees {
			total += mf.Amount
		}

		inv := models.Invoice{
			InvoiceNo:   fmt.Sprintf("INV-FA24-%s%02d", fmt.Sprint(sid), sid),
			StudentID:   sid,
			LaunchID:    fa24.ID,
			TotalAmount: total,
			PaidAmount:  0,
			Status:      "unpaid",
			DueDate:     now.AddDate(0, 1, 0),
			IssuedAt:    now,
		}
		if err := database.DB.Where("invoice_no = ?", inv.InvoiceNo).FirstOrCreate(&inv).Error; err != nil {
			continue
		}
		if inv.ID == 0 {
			continue
		}
		for _, mf := range mandFees {
			database.DB.Where("invoice_id = ? AND fee_structure_id = ?", inv.ID, mf.ID).FirstOrCreate(&models.InvoiceItem{InvoiceID: inv.ID, FeeStructureID: mf.ID, Amount: mf.Amount})
		}
		invCount++

		if sid%2 == 0 {
			payAmt := total
			if sid == studentIDs[4] {
				payAmt = total * 0.5
			}
			database.DB.Create(&models.Payment{
				InvoiceID:     inv.ID,
				Amount:        payAmt,
				PaymentMethod: "bank_transfer",
				ReferenceNo:   fmt.Sprintf("REF-FA24-%s", fmt.Sprint(sid)),
				PaidAt:        now.AddDate(0, 0, -int(sid)*2),
			})
			newPaid := payAmt
			status := "partial"
			if newPaid >= total {
				status = "paid"
			}
			updates := map[string]interface{}{"paid_amount": newPaid, "status": status}
			if status == "paid" {
				updates["paid_at"] = now.AddDate(0, 0, -int(sid)*2)
			}
			database.DB.Model(&inv).Updates(updates)
			payCount++
		}
	}
	msg = append(msg, fmt.Sprintf("Created %d invoices, %d payments", invCount, payCount))

	c.JSON(http.StatusOK, gin.H{
		"message": "Demo data seeded successfully",
		"details": msg,
		"logins": []gin.H{
			{"role": "admin", "email": "admin@education.com", "password": "admin123"},
			{"role": "teacher", "email": "nguyen.van.a@school.edu", "password": "teacher123"},
			{"role": "student", "email": "student1@school.edu", "password": "student123"},
		},
	})
	log.Println("Demo seed complete:", msg)
}
