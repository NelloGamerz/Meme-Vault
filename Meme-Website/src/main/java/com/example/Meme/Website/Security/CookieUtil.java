package com.example.Meme.Website.Security;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class CookieUtil {

    // public void addCookie(HttpServletResponse response, String name, String
    // value, int MaxAge) {
    // Cookie cookie = new Cookie(name, value);
    // cookie.setPath("/");
    // cookie.setHttpOnly(true);
    // cookie.setMaxAge(MaxAge);
    // response.addCookie(cookie);
    // }

    public void addCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // important for HTTPS in production
        cookie.setMaxAge(maxAge);

        // Add the cookie normally
        response.addCookie(cookie);

        // Manually add SameSite=None to the cookie header (overriding default)
        // This is necessary because Cookie class doesn't have SameSite setter
        StringBuilder cookieHeader = new StringBuilder();
        cookieHeader.append(name).append("=").append(value)
                .append("; Path=/")
                .append("; Max-Age=").append(maxAge)
                .append("; Secure")
                .append("; HttpOnly")
                .append("; SameSite=None");

        response.setHeader("Set-Cookie", cookieHeader.toString());
    }

    public void deleteCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, null);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    public String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null)
            return null;
        for (Cookie cookie : request.getCookies()) {
            if (cookie.getName().equals(name)) {
                return cookie.getValue();
            }
        }

        return null;
    }
}
