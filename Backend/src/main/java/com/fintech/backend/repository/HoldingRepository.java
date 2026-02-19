package com.fintech.backend.repository;

import com.fintech.backend.model.Holding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HoldingRepository extends JpaRepository<Holding, Long> {
    List<Holding> findByPortfolioId(Long portfolioId);

    List<Holding> findByPortfolioIdAndStockSymbol(Long portfolioId, String stockSymbol);
}
