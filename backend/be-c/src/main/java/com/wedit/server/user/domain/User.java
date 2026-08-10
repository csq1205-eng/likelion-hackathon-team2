package com.wedit.server.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_users_social_provider_social_id",
                        columnNames = {"social_provider", "social_id"}
                )
        }
)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "social_provider", nullable = false, length = 20)
    private SocialProvider socialProvider;

    @Column(name = "social_id", nullable = false, length = 100)
    private String socialId;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(length = 50)
    private String nickname;

    @Column(name = "profile_image_url", length = 500)
    private String profileImageUrl;

    @Column(name = "onboarding_completed", nullable = false)
    private boolean onboardingCompleted;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected User() {
    }

    private User(
            SocialProvider socialProvider,
            String socialId,
            String email,
            String nickname,
            String profileImageUrl
    ) {
        this.socialProvider = socialProvider;
        this.socialId = socialId;
        this.email = email;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.onboardingCompleted = false;
        this.status = UserStatus.ACTIVE;
    }

    public static User create(
            SocialProvider socialProvider,
            String socialId,
            String email,
            String nickname,
            String profileImageUrl
    ) {
        return new User(socialProvider, socialId, email, nickname, profileImageUrl);
    }

    public void completeOnboarding() {
        this.onboardingCompleted = true;
    }

    public void withdraw() {
        this.status = UserStatus.WITHDRAWN;
    }

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public SocialProvider getSocialProvider() {
        return socialProvider;
    }

    public String getSocialId() {
        return socialId;
    }

    public String getEmail() {
        return email;
    }

    public String getNickname() {
        return nickname;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public boolean isOnboardingCompleted() {
        return onboardingCompleted;
    }

    public UserStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
