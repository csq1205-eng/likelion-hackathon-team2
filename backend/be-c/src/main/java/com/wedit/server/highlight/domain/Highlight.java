package com.wedit.server.highlight.domain;

import com.wedit.server.group.domain.Group;
import com.wedit.server.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "highlights")
public class Highlight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @Column(name = "highlight_date", nullable = false)
    private LocalDate highlightDate;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String summary;

    @Column(name = "video_url", length = 500)
    private String videoUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Highlight() {
    }

    private Highlight(
            User user,
            Group group,
            LocalDate highlightDate,
            String title,
            String summary,
            String videoUrl
    ) {
        this.user = user;
        this.group = group;
        this.highlightDate = highlightDate;
        this.title = title;
        this.summary = summary;
        this.videoUrl = videoUrl;
    }

    public static Highlight create(
            User user,
            Group group,
            LocalDate highlightDate,
            String title,
            String summary,
            String videoUrl
    ) {
        return new Highlight(user, group, highlightDate, title, summary, videoUrl);
    }

    public void update(String title, String summary, String videoUrl) {
        this.title = title;
        this.summary = summary;
        this.videoUrl = videoUrl;
    }

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public LocalDate getHighlightDate() {
        return highlightDate;
    }

    public User getUser() {
        return user;
    }

    public Group getGroup() {
        return group;
    }

    public String getTitle() {
        return title;
    }

    public String getSummary() {
        return summary;
    }

    public String getVideoUrl() {
        return videoUrl;
    }
}
