package com.wedit.server.highlight.repository;

import com.wedit.server.highlight.domain.Highlight;
import com.wedit.server.group.domain.Group;
import com.wedit.server.user.domain.User;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HighlightRepository extends JpaRepository<Highlight, Long> {

    List<Highlight> findAllByUserOrderByHighlightDateDescIdDesc(User user);

    Optional<Highlight> findFirstByGroupAndHighlightDateOrderByIdDesc(Group group, LocalDate highlightDate);

    Optional<Highlight> findFirstByUserAndHighlightDateOrderByIdDesc(User user, LocalDate highlightDate);

    Optional<Highlight> findFirstByUserAndGroupAndHighlightDateOrderByIdDesc(
            User user,
            Group group,
            LocalDate highlightDate
    );
}
