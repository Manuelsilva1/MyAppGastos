package com.manuelsilva.finanzas.dashboard;

import java.util.UUID;

import com.manuelsilva.finanzas.dashboard.DashboardDtos.DashboardResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${app.base-path}/dashboard")
public class DashboardController {

    private final DashboardService dashboard;

    public DashboardController(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping
    DashboardResponse summary(@AuthenticationPrincipal UUID userId,
                              @RequestParam(required = false) String month) {
        return dashboard.summary(userId, month);
    }
}
