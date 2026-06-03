package handlers

import (
	"strconv"

	"go-education-api/internal/utils"
)

func hashPassword(p string) (string, error) {
	return utils.HashPassword(p)
}

func toSnake(s string) string {
	out := []rune{}
	for i, r := range s {
		if i > 0 && r >= 'A' && r <= 'Z' {
			out = append(out, '_')
		}
		if r >= 'A' && r <= 'Z' {
			out = append(out, r+32)
		} else {
			out = append(out, r)
		}
	}
	return string(out)
}

type Pagination struct {
	Page  int
	Limit int
	Skip  int
}

func paginate(c pageParser) Pagination {
	page, _ := strconv.Atoi(c.Query("page"))
	limit, _ := strconv.Atoi(c.Query("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	return Pagination{
		Page:  page,
		Limit: limit,
		Skip:  (page - 1) * limit,
	}
}

type pageParser interface {
	Query(string) string
}

func computeGrade(score float64) (string, float64) {
	switch {
	case score >= 90:
		return "A", 4.0
	case score >= 80:
		return "B", 3.0
	case score >= 70:
		return "C", 2.0
	case score >= 60:
		return "D", 1.0
	default:
		return "F", 0.0
	}
}
