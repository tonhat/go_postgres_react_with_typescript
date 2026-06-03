package handlers

import (
	"net/http"

	"go-education-api/internal/database"
	"go-education-api/internal/models"

	"github.com/gin-gonic/gin"
)

type TranscriptHandler struct{}

func NewTranscriptHandler() *TranscriptHandler {
	return &TranscriptHandler{}
}

func (h *TranscriptHandler) List(c *gin.Context) {
	var transcripts []models.Transcript
	q := database.DB.Order("created_at desc")

	if sid := c.Query("studentId"); sid != "" {
		q = q.Where("student_id = ?", sid)
	}
	if lid := c.Query("launchId"); lid != "" {
		q = q.Where("launch_id = ?", lid)
	}

	var total int64
	q.Model(&models.Transcript{}).Count(&total)

	p := paginate(c)
	if err := q.
		Preload("Student").
		Preload("Student.User").
		Preload("Launch").
		Offset(p.Skip).
		Limit(p.Limit).
		Find(&transcripts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transcripts"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"transcripts": transcripts, "total": total, "page": p.Page, "limit": p.Limit})
}

func (h *TranscriptHandler) Get(c *gin.Context) {
	id := c.Param("id")
	var t models.Transcript
	if err := database.DB.
		Preload("Student").
		Preload("Student.User").
		Preload("Launch").
		First(&t, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transcript not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"transcript": t})
}

func getGradeRules(launchID uint) []models.GradeRule {
	var global []models.GradeRule
	database.DB.Where("launch_id IS NULL").Order("min_score desc").Find(&global)

	var specific []models.GradeRule
	database.DB.Where("launch_id = ?", launchID).Order("min_score desc").Find(&specific)

	override := make(map[string]models.GradeRule)
	for _, r := range specific {
		override[r.LetterGrade] = r
	}

	result := make([]models.GradeRule, len(global))
	for i, r := range global {
		if o, ok := override[r.LetterGrade]; ok {
			result[i] = o
		} else {
			result[i] = r
		}
	}
	return result
}

func computeGradeFromRules(score float64, rules []models.GradeRule) (string, float64) {
	for _, r := range rules {
		if score >= r.MinScore && score <= r.MaxScore {
			return r.LetterGrade, r.GPAPoints
		}
	}
	return "F", 0.0
}

type FinalizeResponse struct {
	Transcripts int     `json:"transcripts"`
	Students    int     `json:"students"`
	AvgGPA      float64 `json:"avgGpa"`
}

func (h *TranscriptHandler) Finalize(c *gin.Context) {
	launchID := c.Param("id")
	var launch models.Launch
	if err := database.DB.First(&launch, launchID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Launch not found"})
		return
	}

	var classIDs []uint
	database.DB.Model(&models.Class{}).Where("launch_id = ?", launchID).Pluck("id", &classIDs)
	if len(classIDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No classes found in this launch"})
		return
	}

	var enrollments []models.Enrollment
	database.DB.
		Preload("Student").
		Preload("Class").
		Preload("Class.Course").
		Where("class_id IN ? AND status = ?", classIDs, "enrolled").
		Find(&enrollments)

	if len(enrollments) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No enrollments found in this launch"})
		return
	}

	rules := getGradeRules(launch.ID)

	type studentAccum struct {
		totalPoints  float64
		totalCredits int
		courseCount  int
	}

	accums := make(map[uint]*studentAccum)
	for _, e := range enrollments {
		if accums[e.StudentID] == nil {
			accums[e.StudentID] = &studentAccum{}
		}
		a := accums[e.StudentID]
		_, gpaPoints := computeGradeFromRules(e.Score, rules)
		credit := e.Class.Course.Credit
		a.totalPoints += gpaPoints * float64(credit)
		a.totalCredits += credit
		a.courseCount++
	}

	tx := database.DB.Begin()

	var studentIDs []uint
	for sid := range accums {
		studentIDs = append(studentIDs, sid)
	}

	tx.Where("launch_id = ? AND student_id IN ?", launchID, studentIDs).Delete(&models.Transcript{})

	var totalGPA float64
	count := 0
	for sid, a := range accums {
		gpa := 0.0
		if a.totalCredits > 0 {
			gpa = a.totalPoints / float64(a.totalCredits)
		}
		t := models.Transcript{
			StudentID:    sid,
			LaunchID:     launch.ID,
			GPA:          gpa,
			TotalCredits: a.totalCredits,
			TotalPoints:  a.totalPoints,
			CourseCount:  a.courseCount,
		}
		if err := tx.Create(&t).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create transcript"})
			return
		}
		tx.Model(&models.Student{}).Where("id = ?", sid).Update("gpa", gpa)
		totalGPA += gpa
		count++
	}

	tx.Commit()

	avgGPA := 0.0
	if count > 0 {
		avgGPA = totalGPA / float64(count)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Launch finalized successfully",
		"transcripts":  count,
		"students":     count,
		"avgGpa":       avgGPA,
	})
}

type ClassReport struct {
	ClassID     uint    `json:"classId"`
	ClassName   string  `json:"className"`
	AvgScore    float64 `json:"avgScore"`
	MinScore    float64 `json:"minScore"`
	MaxScore    float64 `json:"maxScore"`
	PassCount   int     `json:"passCount"`
	FailCount   int     `json:"failCount"`
	TotalCount  int     `json:"totalCount"`
	PassRate    float64 `json:"passRate"`
}

func (h *TranscriptHandler) Report(c *gin.Context) {
	launchID := c.Param("id")

	var classIDs []uint
	database.DB.Model(&models.Class{}).Where("launch_id = ?", launchID).Pluck("id", &classIDs)
	if len(classIDs) == 0 {
		c.JSON(http.StatusOK, gin.H{"report": []ClassReport{}})
		return
	}

	var classes []models.Class
	database.DB.Where("id IN ?", classIDs).Preload("Course").Find(&classes)

	report := []ClassReport{}
	for _, cls := range classes {
		var enrollments []models.Enrollment
		database.DB.Where("class_id = ? AND status = ?", cls.ID, "enrolled").Find(&enrollments)

		if len(enrollments) == 0 {
			continue
		}

		var avg, minS, maxS float64
		passCount := 0
		minS = 999
		maxS = -1
		for _, e := range enrollments {
			avg += e.Score
			if e.Score < minS {
				minS = e.Score
			}
			if e.Score > maxS {
				maxS = e.Score
			}
			if e.Grade != "" && e.Grade != "F" {
				passCount++
			}
		}
		avg /= float64(len(enrollments))

		report = append(report, ClassReport{
			ClassID:    cls.ID,
			ClassName:  cls.Name + " (" + cls.Course.Code + ")",
			AvgScore:   avg,
			MinScore:   minS,
			MaxScore:   maxS,
			PassCount:  passCount,
			FailCount:  len(enrollments) - passCount,
			TotalCount: len(enrollments),
			PassRate:   float64(passCount) / float64(len(enrollments)) * 100,
		})
	}

	c.JSON(http.StatusOK, gin.H{"report": report})
}

func (h *TranscriptHandler) StudentTranscripts(c *gin.Context) {
	studentID := c.Param("id")
	var transcripts []models.Transcript
	if err := database.DB.
		Where("student_id = ?", studentID).
		Preload("Launch").
		Order("created_at desc").
		Find(&transcripts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transcripts"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"transcripts": transcripts})
}

type TranscriptSummary struct {
	Launches    int              `json:"launches"`
	Transcripts int              `json:"transcripts"`
	OverallGPA  float64          `json:"overallGpa"`
}

func (h *TranscriptHandler) Summary(c *gin.Context) {
	var transcripts []models.Transcript
	database.DB.Order("created_at desc").Preload("Launch").Find(&transcripts)

	launchMap := make(map[uint]bool)
	var totalGPA float64
	for _, t := range transcripts {
		launchMap[t.LaunchID] = true
		totalGPA += t.GPA
	}
	count := len(transcripts)
	avgGPA := 0.0
	if count > 0 {
		avgGPA = totalGPA / float64(count)
	}

	launchCount := 0
	for range launchMap {
		launchCount++
	}

	c.JSON(http.StatusOK, gin.H{
		"summary": TranscriptSummary{
			Launches:    launchCount,
			Transcripts: count,
			OverallGPA:  avgGPA,
		},
	})
}


