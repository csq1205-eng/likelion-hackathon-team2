package com.wedit.server.highlight.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.highlight.domain.Highlight;
import com.wedit.server.highlight.dto.HighlightItemResponse;
import com.wedit.server.highlight.dto.HighlightListResponse;
import com.wedit.server.highlight.repository.HighlightRepository;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HighlightService {

    private final UserRepository userRepository;
    private final HighlightRepository highlightRepository;

    public HighlightService(
            UserRepository userRepository,
            HighlightRepository highlightRepository
    ) {
        this.userRepository = userRepository;
        this.highlightRepository = highlightRepository;
    }

    @Transactional(readOnly = true)
    public HighlightListResponse getHighlights(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return new HighlightListResponse(highlightRepository.findAllByUserOrderByHighlightDateDescIdDesc(user)
                .stream()
                .map(this::toHighlightItemResponse)
                .toList());
    }

    private HighlightItemResponse toHighlightItemResponse(Highlight highlight) {
        return new HighlightItemResponse(
                highlight.getId(),
                highlight.getHighlightDate(),
                highlight.getTitle(),
                highlight.getSummary(),
                highlight.getVideoUrl()
        );
    }
}
