package com.wedit.server.stamp.domain;

import com.wedit.server.group.domain.Group;
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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "stamps")
public class Stamp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @Enumerated(EnumType.STRING)
    @Column(name = "stamp_type", nullable = false, length = 20)
    private StampType stampType;

    @Column(name = "stamp_date", nullable = false)
    private LocalDate stampDate;

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Stamp() {
    }

    private Stamp(User user, Group group, StampType stampType, LocalDate stampDate, String reason) {
        this.user = user;
        this.group = group;
        this.stampType = stampType;
        this.stampDate = stampDate;
        this.reason = reason;
    }

    public static Stamp createPersonal(User user, Group group, LocalDate stampDate) {
        return new Stamp(user, group, StampType.PERSONAL, stampDate, "하루 미션 3개 완료");
    }

    public static Stamp createGroup(Group group, LocalDate stampDate) {
        return new Stamp(null, group, StampType.GROUP, stampDate, "그룹원 전원 하루 미션 3개 완료");
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

    public StampType getStampType() {
        return stampType;
    }

    public LocalDate getStampDate() {
        return stampDate;
    }

    public String getReason() {
        return reason;
    }
}
