package routes

import (
	"net/http"

	"go-education-api/internal/config"
	"go-education-api/internal/handlers"
	"go-education-api/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(cfg *config.Config, r *gin.Engine) *gin.Engine {
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "go-education-api"})
	})

	authHandler := handlers.NewAuthHandler(cfg)
	userHandler := handlers.NewUserHandler()
	studentHandler := handlers.NewStudentHandler()
	teacherHandler := handlers.NewTeacherHandler()
	courseHandler := handlers.NewCourseHandler()
	classHandler := handlers.NewClassHandler()
	launchHandler := handlers.NewLaunchHandler()
	attendanceHandler := handlers.NewAttendanceHandler()
	gradeRuleHandler := handlers.NewGradeRuleHandler()
	transcriptHandler := handlers.NewTranscriptHandler()

	api := r.Group("/api")

	auth := api.Group("/auth")
	{
		auth.POST("/signup", authHandler.Signup)
		auth.POST("/signin", authHandler.Signin)
		auth.POST("/signout", authHandler.Signout)
	}

	protected := api.Group("")
	protected.Use(middleware.Auth(cfg))
	{
		protected.GET("/auth/me", authHandler.Me)

		readAll := protected.Group("")
		readAll.Use(middleware.RequireRole("admin", "teacher", "student"))
		{
			readAll.GET("/users", userHandler.List)
			readAll.GET("/users/:id", userHandler.Get)

			readAll.GET("/students", studentHandler.List)
			readAll.GET("/students/:id", studentHandler.Get)

			readAll.GET("/teachers", teacherHandler.List)
			readAll.GET("/teachers/:id", teacherHandler.Get)

			readAll.GET("/courses", courseHandler.List)
			readAll.GET("/courses/:id", courseHandler.Get)

			readAll.GET("/classes", classHandler.List)
			readAll.GET("/classes/:id", classHandler.Get)
			readAll.GET("/classes/:id/enrollments", classHandler.ListEnrollments)

			readAll.GET("/launches", launchHandler.List)
			readAll.GET("/launches/:id", launchHandler.Get)

			readAll.GET("/classes/:id/attendance", attendanceHandler.List)
			readAll.GET("/classes/:id/attendance/summary", attendanceHandler.Summary)

			readAll.GET("/grade-rules", gradeRuleHandler.List)
			readAll.GET("/grade-rules/:id", gradeRuleHandler.Get)

			readAll.GET("/transcripts", transcriptHandler.List)
			readAll.GET("/transcripts/:id", transcriptHandler.Get)
			readAll.GET("/students/:id/transcripts", transcriptHandler.StudentTranscripts)
			readAll.GET("/launches/:id/report", transcriptHandler.Report)
			readAll.GET("/transcripts/summary", transcriptHandler.Summary)
		}

		adminWrite := protected.Group("")
		adminWrite.Use(middleware.RequireRole("admin"))
		{
			adminWrite.PUT("/users/:id", userHandler.Update)
			adminWrite.DELETE("/users/:id", userHandler.Delete)

			adminWrite.POST("/students", studentHandler.Create)
			adminWrite.PUT("/students/:id", studentHandler.Update)
			adminWrite.DELETE("/students/:id", studentHandler.Delete)

			adminWrite.POST("/teachers", teacherHandler.Create)
			adminWrite.PUT("/teachers/:id", teacherHandler.Update)
			adminWrite.DELETE("/teachers/:id", teacherHandler.Delete)

			adminWrite.POST("/courses", courseHandler.Create)
			adminWrite.PUT("/courses/:id", courseHandler.Update)
			adminWrite.DELETE("/courses/:id", courseHandler.Delete)

			adminWrite.POST("/classes", classHandler.Create)
			adminWrite.PUT("/classes/:id", classHandler.Update)
			adminWrite.DELETE("/classes/:id", classHandler.Delete)

			adminWrite.POST("/launches", launchHandler.Create)
			adminWrite.PUT("/launches/:id", launchHandler.Update)
			adminWrite.DELETE("/launches/:id", launchHandler.Delete)

			adminWrite.POST("/grade-rules", gradeRuleHandler.Create)
			adminWrite.PUT("/grade-rules/:id", gradeRuleHandler.Update)
			adminWrite.DELETE("/grade-rules/:id", gradeRuleHandler.Delete)

			adminWrite.POST("/launches/:id/finalize", transcriptHandler.Finalize)
		}

		teacherOps := protected.Group("")
		teacherOps.Use(middleware.RequireRole("admin", "teacher"))
		{
			teacherOps.POST("/classes/:id/enroll", classHandler.Enroll)
			teacherOps.PUT("/enrollments/:eid", classHandler.UpdateEnrollment)
			teacherOps.DELETE("/enrollments/:eid", classHandler.DropEnrollment)
			teacherOps.POST("/classes/:id/attendance/bulk", attendanceHandler.MarkBulk)
		}
	}

	return r
}
