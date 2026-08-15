package com.wedit.server.highlight.repository;

import com.wedit.server.highlight.domain.Highlight;
import com.wedit.server.user.domain.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HighlightRepository extends JpaRepository<Highlight, Long> {

    List<Highlight> findAllByUserOrderByHighlightDateDescIdDesc(User user);
}
