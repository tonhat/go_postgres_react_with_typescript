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
		protected.GET("/users", userHandler.List)
		protected.GET("/users/:id", userHandler.Get)
		protected.PUT("/users/:id", userHandler.Update)
		protected.DELETE("/users/:id", userHandler.Delete)

		protected.GET("/students", studentHandler.List)
		protected.GET("/students/:id", studentHandler.Get)
		protected.POST("/students", studentHandler.Create)
		protected.PUT("/students/:id", studentHandler.Update)
		protected.DELETE("/students/:id", studentHandler.Delete)

		protected.GET("/teachers", teacherHandler.List)
		protected.GET("/teachers/:id", teacherHandler.Get)
		protected.POST("/teachers", teacherHandler.Create)
		protected.PUT("/teachers/:id", teacherHandler.Update)
		protected.DELETE("/teachers/:id", teacherHandler.Delete)

		protected.GET("/courses", courseHandler.List)
		protected.GET("/courses/:id", courseHandler.Get)
		protected.POST("/courses", courseHandler.Create)
		protected.PUT("/courses/:id", courseHandler.Update)
		protected.DELETE("/courses/:id", courseHandler.Delete)

		protected.GET("/classes", classHandler.List)
		protected.GET("/classes/:id", classHandler.Get)
		protected.POST("/classes", classHandler.Create)
		protected.PUT("/classes/:id", classHandler.Update)
		protected.DELETE("/classes/:id", classHandler.Delete)
		protected.POST("/classes/:id/enroll", classHandler.Enroll)
		protected.GET("/classes/:id/enrollments", classHandler.ListEnrollments)

		protected.GET("/launches", launchHandler.List)
		protected.GET("/launches/:id", launchHandler.Get)
		protected.POST("/launches", launchHandler.Create)
		protected.PUT("/launches/:id", launchHandler.Update)
		protected.DELETE("/launches/:id", launchHandler.Delete)
	}

	return r
}
