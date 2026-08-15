package com.wedit.server.mission.domain;

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
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "mission_results")
public class MissionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_id", nullable = false)
    private Mission mission;

    @Column(name = "clip_id")
    private Long clipId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MissionResultType result;

    @Column(length = 500)
    private String reason;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    @Column(name = "prompt_version", nullable = false, length = 50)
    private String promptVersion;

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    @Column(name = "judged_at", nullable = false)
    private LocalDateTime judgedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected MissionResult() {
    }

    private MissionResult(Mission mission, Long clipId, User user, MissionResultType result) {
        this(mission, clipId, user, result, null, null, "mission-judge-prompt-v1", "wedit-judge-v1", LocalDateTime.now());
    }

    private MissionResult(
            Mission mission,
            Long clipId,
            User user,
            MissionResultType result,
            String reason,
            BigDecimal confidenceScore,
            String promptVersion,
            String modelVersion,
            LocalDateTime judgedAt
    ) {
        this.mission = mission;
        this.clipId = clipId;
        this.user = user;
        this.result = result;
        this.reason = reason;
        this.confidenceScore = confidenceScore;
        this.promptVersion = promptVersion;
        this.modelVersion = modelVersion;
        this.judgedAt = judgedAt;
    }

    public static MissionResult create(Mission mission, Long clipId, User user, MissionResultType result) {
        return new MissionResult(mission, clipId, user, result);
    }

    public static MissionResult create(
            Mission mission,
            Long clipId,
            User user,
            MissionResultType result,
            String reason,
            BigDecimal confidenceScore,
            String promptVersion,
            String modelVersion,
            LocalDateTime judgedAt
    ) {
        return new MissionResult(mission, clipId, user, result, reason, confidenceScore, promptVersion, modelVersion, judgedAt);
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Mission getMission() {
        return mission;
    }

    public User getUser() {
        return user;
    }

    public MissionResultType getResult() {
        return result;
    }

    public Long getClipId() {
        return clipId;
    }

    public String getReason() {
        return reason;
    }

    public BigDecimal getConfidenceScore() {
        return confidenceScore;
    }

    public LocalDateTime getJudgedAt() {
        return judgedAt;
    }
}
