package com.fintech.backend.repository;

import com.fintech.backend.model.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {
    List<Trade> findByUserId(Long userId);

    List<Trade> findByUserIdAndTimestampBetween(Long userId, java.time.LocalDateTime startDate,
            java.time.LocalDateTime endDate);
}
