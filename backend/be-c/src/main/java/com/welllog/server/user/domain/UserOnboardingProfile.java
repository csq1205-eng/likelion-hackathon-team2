package com.welllog.server.user.domain;

import com.welllog.server.common.StringListJsonConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "user_onboarding_profiles")
public class UserOnboardingProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "main_concern", nullable = false, length = 50)
    private String mainConcern;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "cause_candidates", columnDefinition = "text")
    private List<String> causeCandidates;

    @Column(name = "sleep_hours", precision = 3, scale = 1)
    private BigDecimal sleepHours;

    @Column(name = "water_intake", precision = 4, scale = 1)
    private BigDecimal waterIntake;

    @Column(name = "wake_up_time")
    private LocalTime wakeUpTime;

    @Column(name = "sleep_time")
    private LocalTime sleepTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected UserOnboardingProfile() {
    }

    private UserOnboardingProfile(
            User user,
            String mainConcern,
            List<String> causeCandidates,
            BigDecimal sleepHours,
            BigDecimal waterIntake,
            LocalTime wakeUpTime,
            LocalTime sleepTime
    ) {
        this.user = user;
        update(mainConcern, causeCandidates, sleepHours, waterIntake, wakeUpTime, sleepTime);
    }

    public static UserOnboardingProfile create(
            User user,
            String mainConcern,
            List<String> causeCandidates,
            BigDecimal sleepHours,
            BigDecimal waterIntake,
            LocalTime wakeUpTime,
            LocalTime sleepTime
    ) {
        return new UserOnboardingProfile(
                user,
                mainConcern,
                causeCandidates,
                sleepHours,
                waterIntake,
                wakeUpTime,
                sleepTime
        );
    }

    public void update(
            String mainConcern,
            List<String> causeCandidates,
            BigDecimal sleepHours,
            BigDecimal waterIntake,
            LocalTime wakeUpTime,
            LocalTime sleepTime
    ) {
        this.mainConcern = mainConcern;
        this.causeCandidates = causeCandidates;
        this.sleepHours = sleepHours;
        this.waterIntake = waterIntake;
        this.wakeUpTime = wakeUpTime;
        this.sleepTime = sleepTime;
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

    public User getUser() {
        return user;
    }

    public String getMainConcern() {
        return mainConcern;
    }

    public List<String> getCauseCandidates() {
        return causeCandidates;
    }

    public BigDecimal getSleepHours() {
        return sleepHours;
    }

    public BigDecimal getWaterIntake() {
        return waterIntake;
    }

    public LocalTime getWakeUpTime() {
        return wakeUpTime;
    }

    public LocalTime getSleepTime() {
        return sleepTime;
    }
}
