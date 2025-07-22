> <h4>2025S KAIST 몰입캠프</h4>
> <h4>Week 2 : 2025. 07. 10. ~ 2025. 07. 16.</h4>

---

## 👥 Team Members
<table>
    <tr>
      <td align="center" width="200">
        <a href="https://github.com/7lram">
          <img width="120" height="120" alt="Image" src="https://github.com/user-attachments/assets/bed619eb-5f33-4ea5-942a-3607bd4b294d" />
          <br />
        </a>
      </td>
      <td align="center" width="200">
        <a href="https://github.com/chngmn">
          <img width="120" height="120" alt="Image" src="https://github.com/user-attachments/assets/20771cb6-a9f0-4648-87ac-f9e3268767e1" />
          <br />
        </a>
      </td>
    </tr>
    <tr>
      <td align="center">
        <b>백서경</b>
      </td>
      <td align="center">
        <b>이창민</b>
      </td>
    </tr>
  <tr>
    <td align="center">
      <p>고려대학교 데이터과학과</p>
    </td>
    <td align="center">
      <p>카이스트 전산학부</p>
    </td>
  </tr>
</table>

---

# 📸 Cutprint

- Cutprint는 React Native Expo 프론트엔드와 NestJS 백엔드로 구성된 포토부스 앱입니다.
- 사진 촬영, 필터/프레임 적용, 저장/공유, 친구 관리, 협업 촬영 등 다양한 소셜 기능 제공

---

## 🏗️ 아키텍처
- **백엔드**: NestJS, PostgreSQL, TypeORM, JWT(구글 OAuth 지원)
- **프론트엔드**: React Native Expo, Stack/Tab 네비게이션, 카메라/사진 편집, 소셜 관리

---

## 🛠️ 주요 개발 명령어
- **백엔드**: `npm run start:dev`, `npm run build`, `npm run test`, `npm run test:e2e`, `npm run lint`, `npm run format`
- **프론트엔드**: `npm start`, `npm run android`, `npm run ios`, `npm run web`

---

## 🗄️ 데이터베이스
- PostgreSQL 사용 (로컬: localhost:5432, 사용자: seokyung, 비밀번호 없음)
- TypeORM 동기화로 개발 환경에서 스키마 자동 업데이트

---

## 📁 주요 디렉터리 구조
- **백엔드**: entities, auth, photo, friendship, s3, config 등
- **프론트엔드**: screens, navigation, components, services, utils, constants 등

---

## 🧪 테스트 및 기술 스택
- **백엔드**: Jest 기반 단위/통합 테스트, *.spec.ts 파일명 사용
- **주요 라이브러리(백엔드)**: @aws-sdk/client-s3, bcrypt, passport-jwt, multer
- **주요 라이브러리(프론트엔드)**: expo-camera, expo-image-manipulator, react-native-view-shot

---

## 💡 기타 개발 참고사항
- 백엔드 기본 포트: 3000, 개발 환경 CORS 허용
- 프론트엔드: Pretendard 폰트, 세로 화면 고정
- 인증: 이메일/비밀번호 및 구글 OAuth 지원
- 사진 편집: 필터, 프레임, 공유 기능 제공
- AWS S3 연동, 소셜 기능(친구, 알림, 협업 세션) 포함 
