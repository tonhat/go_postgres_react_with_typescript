package main

import (
	"log"
	"os"

	"go-education-api/internal/config"
	"go-education-api/internal/database"
	"go-education-api/internal/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	cfg := config.Load()

	if err := database.Connect(cfg); err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if err := database.Migrate(); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	if err := database.Seed(); err != nil {
		log.Fatalf("failed to seed database: %v", err)
	}

	if cfg.GinMode != "" {
		gin.SetMode(cfg.GinMode)
	}

	app := gin.Default()

	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	routes.SetupRoutes(cfg, app)

	port := cfg.ServerPort
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := app.Run(":" + port); err != nil {
		log.Fatalf("failed to run server: %v", err)
		os.Exit(1)
	}
}
