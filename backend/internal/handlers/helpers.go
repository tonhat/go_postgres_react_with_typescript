package handlers

import (
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
