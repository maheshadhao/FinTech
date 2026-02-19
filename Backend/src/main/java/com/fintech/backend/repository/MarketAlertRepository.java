package com.fintech.backend.repository;

import com.fintech.backend.model.MarketAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketAlertRepository extends JpaRepository<MarketAlert, Long> {
    List<MarketAlert> findByUserId(Long userId);

    List<MarketAlert> findByStockSymbol(String stockSymbol);

    List<MarketAlert> findByIsTriggeredFalse();
}
