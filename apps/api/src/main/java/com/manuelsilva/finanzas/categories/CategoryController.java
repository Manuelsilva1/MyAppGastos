package com.manuelsilva.finanzas.categories;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${app.base-path}/categories")
public class CategoryController {

    private final CategoryRepository categories;

    public CategoryController(CategoryRepository categories) {
        this.categories = categories;
    }

    @GetMapping
    CategoryListResponse list(@AuthenticationPrincipal UUID userId,
                              @RequestParam(required = false) String kind) {
        List<CategoryResponse> items = categories.findByUserIdAndArchivedAtIsNullOrderBySortOrderAscNameAsc(userId).stream()
                .filter(c -> kind == null || kind.equals(c.getKind()))
                .map(c -> new CategoryResponse(c.getId(), c.getParentId(), c.getName(), c.getKind(),
                        c.getColor(), c.getIcon(), c.getSortOrder()))
                .toList();
        return new CategoryListResponse(items);
    }

    public record CategoryResponse(UUID id, UUID parentId, String name, String kind, String color, String icon,
                                   int sortOrder) {
    }

    public record CategoryListResponse(List<CategoryResponse> items) {
    }
}
