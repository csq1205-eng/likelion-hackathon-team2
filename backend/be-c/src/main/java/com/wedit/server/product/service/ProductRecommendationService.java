package com.wedit.server.product.service;

import com.wedit.server.common.CustomException;
import com.wedit.server.common.ErrorCode;
import com.wedit.server.group.domain.Group;
import com.wedit.server.group.domain.GroupMemberStatus;
import com.wedit.server.group.domain.GroupStatus;
import com.wedit.server.group.repository.GroupMemberRepository;
import com.wedit.server.group.repository.GroupRepository;
import com.wedit.server.product.domain.ProductRecommendation;
import com.wedit.server.product.domain.ProductRecommendationType;
import com.wedit.server.product.dto.ProductRecommendationCreateResponse;
import com.wedit.server.product.dto.ProductRecommendationItemResponse;
import com.wedit.server.product.dto.ProductRecommendationListResponse;
import com.wedit.server.product.repository.ProductRecommendationRepository;
import com.wedit.server.user.domain.ProductCategory;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserOwnedProduct;
import com.wedit.server.user.repository.UserOwnedProductRepository;
import com.wedit.server.user.repository.UserRepository;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductRecommendationService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserOwnedProductRepository userOwnedProductRepository;
    private final ProductRecommendationRepository productRecommendationRepository;

    public ProductRecommendationService(
            UserRepository userRepository,
            GroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            UserOwnedProductRepository userOwnedProductRepository,
            ProductRecommendationRepository productRecommendationRepository
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userOwnedProductRepository = userOwnedProductRepository;
        this.productRecommendationRepository = productRecommendationRepository;
    }

    @Transactional(readOnly = true)
    public ProductRecommendationListResponse getRecommendations(Long userId, ProductRecommendationType type) {
        User user = findUser(userId);
        List<ProductRecommendation> recommendations = type == null
                ? productRecommendationRepository.findAllByUserOrderByCreatedAtDesc(user)
                : productRecommendationRepository.findAllByUserAndRecommendationTypeOrderByCreatedAtDesc(user, type);

        return new ProductRecommendationListResponse(
                user.getId(),
                recommendations.stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @Transactional
    public ProductRecommendationCreateResponse createMissingProductRecommendations(Long userId) {
        User user = findUser(userId);
        Set<ProductCategory> ownedCategories = userOwnedProductRepository.findAllByUser(user)
                .stream()
                .filter(UserOwnedProduct::isHasProduct)
                .map(UserOwnedProduct::getCategory)
                .collect(Collectors.toSet());

        List<ProductRecommendation> recommendations = Arrays.stream(ProductCategory.values())
                .filter(category -> !ownedCategories.contains(category))
                .map(category -> productRecommendationRepository.save(ProductRecommendation.create(
                        user,
                        null,
                        ProductRecommendationType.MISSING_PRODUCT,
                        category,
                        toDefaultProductName(category),
                        toMissingProductReason(category)
                )))
                .toList();

        return new ProductRecommendationCreateResponse(
                user.getId(),
                ProductRecommendationType.MISSING_PRODUCT.name(),
                recommendations.size(),
                recommendations.stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    @Transactional
    public ProductRecommendationCreateResponse createCommerceRecommendations(Long userId, Long groupId) {
        User user = findUser(userId);
        Group group = findGroup(groupId);
        validateActiveMember(group, user);
        if (group.getStatus() != GroupStatus.COMPLETED) {
            throw new CustomException(ErrorCode.INVALID_INPUT);
        }

        List<ProductRecommendation> recommendations = List.of(
                productRecommendationRepository.save(ProductRecommendation.create(
                        user,
                        group,
                        ProductRecommendationType.COMMERCE,
                        ProductCategory.SKINCARE,
                        "W 정원 완주 스킨케어 키트",
                        "W 정원 완성 시점의 꾸준한 관리 흐름을 이어갈 수 있도록 추천합니다."
                )),
                productRecommendationRepository.save(ProductRecommendation.create(
                        user,
                        group,
                        ProductRecommendationType.COMMERCE,
                        ProductCategory.BODY,
                        "데일리 바디 케어 세트",
                        "그룹 완주 후 생활 루틴을 확장할 수 있는 보상형 추천입니다."
                ))
        );

        return new ProductRecommendationCreateResponse(
                user.getId(),
                ProductRecommendationType.COMMERCE.name(),
                recommendations.size(),
                recommendations.stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
    }

    private Group findGroup(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_NOT_FOUND));
    }

    private void validateActiveMember(Group group, User user) {
        if (!groupMemberRepository.existsByGroupAndUserAndStatus(group, user, GroupMemberStatus.ACTIVE)) {
            throw new CustomException(ErrorCode.GROUP_ACCESS_DENIED);
        }
    }

    private ProductRecommendationItemResponse toResponse(ProductRecommendation recommendation) {
        return new ProductRecommendationItemResponse(
                recommendation.getId(),
                recommendation.getGroup() == null ? null : recommendation.getGroup().getId(),
                recommendation.getRecommendationType().name(),
                recommendation.getCategory() == null ? null : recommendation.getCategory().name(),
                recommendation.getProductName(),
                recommendation.getReason(),
                recommendation.getCreatedAt()
        );
    }

    private String toDefaultProductName(ProductCategory category) {
        return switch (category) {
            case SKINCARE -> "기본 스킨케어 제품";
            case BODY -> "바디 케어 제품";
            case CLEANSING -> "클렌징 제품";
            case ETC -> "생활 습관 보조 제품";
        };
    }

    private String toMissingProductReason(ProductCategory category) {
        return switch (category) {
            case SKINCARE -> "온보딩에서 스킨케어 제품 보유가 확인되지 않아 추천합니다.";
            case BODY -> "온보딩에서 바디 제품 보유가 확인되지 않아 추천합니다.";
            case CLEANSING -> "온보딩에서 클렌징 제품 보유가 확인되지 않아 추천합니다.";
            case ETC -> "온보딩에서 기타 관리 제품 보유가 확인되지 않아 추천합니다.";
        };
    }
}
