package com.manuelsilva.finanzas.currencies;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
@RequestMapping("${app.base-path}/currencies")
public class CurrencyController {

    private final CurrencyRepository currencies;

    public CurrencyController(CurrencyRepository currencies) {
        this.currencies = currencies;
    }

    @GetMapping
    @ResponseBody
    CurrencyListResponse list() {
        List<CurrencyResponse> items = currencies.findAll().stream()
                .map(c -> new CurrencyResponse(c.getCode(), c.getName(), c.getSymbol(), c.getDecimals()))
                .toList();
        return new CurrencyListResponse(items);
    }

    public record CurrencyResponse(String code, String name, String symbol, int decimals) {
    }

    public record CurrencyListResponse(List<CurrencyResponse> items) {
    }
}
