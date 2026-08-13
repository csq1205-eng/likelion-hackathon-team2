package com.wedit.server.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_consents")
public class UserConsent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "privacy_required_agreed", nullable = false)
    private boolean privacyRequiredAgreed;

    @Column(name = "training_data_agreed", nullable = false)
    private boolean trainingDataAgreed;

    @Column(name = "privacy_agreed_at")
    private LocalDateTime privacyAgreedAt;

    @Column(name = "training_data_agreed_at")
    private LocalDateTime trainingDataAgreedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected UserConsent() {
    }

    private UserConsent(User user) {
        this.user = user;
        this.privacyRequiredAgreed = false;
        this.trainingDataAgreed = false;
    }

    public static UserConsent createDefault(User user) {
        return new UserConsent(user);
    }

    public boolean isRequiredConsentCompleted() {
        return privacyRequiredAgreed;
    }

    public User getUser() {
        return user;
    }

    public void updatePrivacyRequiredAgreement(boolean agreed) {
        this.privacyRequiredAgreed = agreed;
        this.privacyAgreedAt = agreed ? LocalDateTime.now() : null;
    }

    public void updateTrainingDataAgreement(boolean agreed) {
        this.trainingDataAgreed = agreed;
        this.trainingDataAgreedAt = agreed ? LocalDateTime.now() : null;
    }

    public boolean isPrivacyRequiredAgreed() {
        return privacyRequiredAgreed;
    }

    public LocalDateTime getPrivacyAgreedAt() {
        return privacyAgreedAt;
    }

    public boolean isTrainingDataAgreed() {
        return trainingDataAgreed;
    }

    public LocalDateTime getTrainingDataAgreedAt() {
        return trainingDataAgreedAt;
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
}
