package com.wedit.server.point.domain;

import com.wedit.server.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "point_redemptions")
public class PointRedemption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "redemption_type", nullable = false, length = 50)
    private String redemptionType;

    @Column(name = "point_amount", nullable = false)
    private int pointAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PointRedemptionStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected PointRedemption() {
    }

    private PointRedemption(User user, String redemptionType, int pointAmount) {
        this.user = user;
        this.redemptionType = redemptionType;
        this.pointAmount = pointAmount;
        this.status = PointRedemptionStatus.REQUESTED;
    }

    public static PointRedemption create(User user, String redemptionType, int pointAmount) {
        return new PointRedemption(user, redemptionType, pointAmount);
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getRedemptionType() {
        return redemptionType;
    }

    public int getPointAmount() {
        return pointAmount;
    }

    public PointRedemptionStatus getStatus() {
        return status;
    }
}
