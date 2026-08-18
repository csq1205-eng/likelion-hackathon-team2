package com.wedit.server.product.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.wedit.server.group.dto.GroupCreateRequest;
import com.wedit.server.group.dto.GroupCreateResponse;
import com.wedit.server.group.repository.GroupRepository;
import com.wedit.server.group.service.GroupService;
import com.wedit.server.product.domain.ProductRecommendationType;
import com.wedit.server.product.dto.ProductRecommendationCreateResponse;
import com.wedit.server.product.dto.ProductRecommendationListResponse;
import com.wedit.server.product.repository.ProductRecommendationRepository;
import com.wedit.server.user.domain.ProductCategory;
import com.wedit.server.user.domain.SocialProvider;
import com.wedit.server.user.domain.User;
import com.wedit.server.user.domain.UserOwnedProduct;
import com.wedit.server.user.repository.UserOwnedProductRepository;
import com.wedit.server.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ProductRecommendationServiceTest {

    @Autowired
    private ProductRecommendationService productRecommendationService;

    @Autowired
    private GroupService groupService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private UserOwnedProductRepository userOwnedProductRepository;

    @Autowired
    private ProductRecommendationRepository productRecommendationRepository;

    @Test
    @DisplayName("온보딩에서 보유하지 않은 제품 카테고리를 부족분 추천으로 생성한다")
    void createMissingProductRecommendations() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-product-user",
                "product@example.com",
                "정효림",
                null
        ));
        userOwnedProductRepository.save(UserOwnedProduct.create(user, ProductCategory.SKINCARE, true));
        userOwnedProductRepository.save(UserOwnedProduct.create(user, ProductCategory.BODY, false));

        ProductRecommendationCreateResponse response =
                productRecommendationService.createMissingProductRecommendations(user.getId());

        assertThat(response.userId()).isEqualTo(user.getId());
        assertThat(response.recommendationType()).isEqualTo(ProductRecommendationType.MISSING_PRODUCT.name());
        assertThat(response.createdCount()).isEqualTo(3);
        assertThat(response.recommendations())
                .extracting("category")
                .containsExactlyInAnyOrder("BODY", "CLEANSING", "ETC");
        assertThat(productRecommendationRepository.count()).isEqualTo(3);
    }

    @Test
    @DisplayName("그룹 완주 후 커머스 추천을 생성하고 유형별로 조회한다")
    void createCommerceRecommendations() {
        User user = userRepository.save(User.create(
                SocialProvider.KAKAO,
                "kakao-commerce-user",
                "commerce@example.com",
                "효림",
                null
        ));
        GroupCreateResponse createdGroup = groupService.createGroup(
                user.getId(),
                new GroupCreateRequest("아침 루틴 챌린지", "21일 W 정원 완성", 0)
        );
        groupService.completeGarden(user.getId(), createdGroup.groupId());

        ProductRecommendationCreateResponse created =
                productRecommendationService.createCommerceRecommendations(user.getId(), createdGroup.groupId());
        ProductRecommendationListResponse list = productRecommendationService.getRecommendations(
                user.getId(),
                ProductRecommendationType.COMMERCE
        );

        assertThat(groupRepository.findById(createdGroup.groupId())).isPresent();
        assertThat(created.createdCount()).isEqualTo(2);
        assertThat(created.recommendations())
                .extracting("groupId")
                .containsOnly(createdGroup.groupId());
        assertThat(list.recommendations()).hasSize(2);
        assertThat(list.recommendations())
                .extracting("recommendationType")
                .containsOnly(ProductRecommendationType.COMMERCE.name());
    }
}
