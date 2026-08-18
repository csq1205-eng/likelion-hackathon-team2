package com.wedit.server.product.domain;

import com.wedit.server.group.domain.Group;
import com.wedit.server.user.domain.ProductCategory;
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
@Table(name = "product_recommendations")
public class ProductRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommendation_type", nullable = false, length = 30)
    private ProductRecommendationType recommendationType;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private ProductCategory category;

    @Column(name = "product_name", length = 100)
    private String productName;

    @Column(length = 500)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected ProductRecommendation() {
    }

    private ProductRecommendation(
            User user,
            Group group,
            ProductRecommendationType recommendationType,
            ProductCategory category,
            String productName,
            String reason
    ) {
        this.user = user;
        this.group = group;
        this.recommendationType = recommendationType;
        this.category = category;
        this.productName = productName;
        this.reason = reason;
    }

    public static ProductRecommendation create(
            User user,
            Group group,
            ProductRecommendationType recommendationType,
            ProductCategory category,
            String productName,
            String reason
    ) {
        return new ProductRecommendation(user, group, recommendationType, category, productName, reason);
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Group getGroup() {
        return group;
    }

    public ProductRecommendationType getRecommendationType() {
        return recommendationType;
    }

    public ProductCategory getCategory() {
        return category;
    }

    public String getProductName() {
        return productName;
    }

    public String getReason() {
        return reason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
