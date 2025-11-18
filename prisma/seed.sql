-- Mock Data cho Study Space Platform
-- Tiếng Việt - PostgreSQL
-- Chạy script này: psql -U user -d database_name -f seed.sql

-- Disable foreign key constraints temporarily
SET session_replication_role = 'replica';

-- Clear existing data (nếu cần)
-- DELETE FROM "EventReminder";
-- DELETE FROM "EventAssignment";
-- DELETE FROM "CalendarEvent";
-- DELETE FROM "ProgressRecord";
-- DELETE FROM "MentorFeedback";
-- DELETE FROM "Review";
-- DELETE FROM "Reaction";
-- DELETE FROM "Comment";
-- DELETE FROM "Post";
-- DELETE FROM "Message";
-- DELETE FROM "File";
-- DELETE FROM "Recording";
-- DELETE FROM "Channel";
-- DELETE FROM "ServerMember";
-- DELETE FROM "ServerInvitation";
-- DELETE FROM "ChatServer";
-- DELETE FROM "MenteeConnection";
-- DELETE FROM "MentorProfile";
-- DELETE FROM "User";

-- ==================== USERS - MENTORS ====================
INSERT INTO "User" (id, name, email, image, role, department, major, year, bio, achievements, "createdAt", "updatedAt")
VALUES
  ('mentor001', 'Nguyễn Văn A', 'mentor.a@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentor001', 'MENTOR', 'Khoa Công Nghệ Thông Tin', 'Kỹ Thuật Phần Mềm', NULL, 'Mentor có 10 năm kinh nghiệm lập trình', ARRAY['Giải Nhất Lập Trình 2020', 'MVP 2021'], NOW() - INTERVAL '180 days', NOW()),
  ('mentor002', 'Trần Thị B', 'mentor.b@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentor002', 'MENTOR', 'Khoa Công Nghệ Thông Tin', 'Khoa Học Máy Tính', NULL, 'Chuyên gia về AI và Machine Learning', ARRAY['Top 1% Kaggle', 'Bài báo quốc tế'], NOW() - INTERVAL '200 days', NOW()),
  ('mentor003', 'Lê Minh C', 'mentor.c@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentor003', 'MENTOR', 'Khoa Công Nghệ Thông Tin', 'An Toàn Thông Tin', NULL, 'Chuyên gia bảo mật, giảng viên tại ĐH', ARRAY['Chứng chỉ CISSP', 'Dẫn dắt 50+ học viên'], NOW() - INTERVAL '220 days', NOW()),
  ('mentor004', 'Phạm Quốc D', 'mentor.d@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentor004', 'MENTOR', 'Khoa Kỹ Thuật', 'Hệ Thống Thông Tin', NULL, 'Kiến trúc sư phần mềm, founder startup', ARRAY['Startup Series A', '5M+ người dùng'], NOW() - INTERVAL '240 days', NOW()),
  ('mentor005', 'Hoàng Thu E', 'mentor.e@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentor005', 'MENTOR', 'Khoa Công Nghệ Thông Tin', 'Phát Triển Web', NULL, 'Full-stack developer, React & Node.js expert', ARRAY['100+ projects', '10 năm kinh nghiệm'], NOW() - INTERVAL '190 days', NOW()),
  ('mentor006', 'Võ Thành F', 'mentor.f@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentor006', 'MENTOR', 'Khoa Công Nghệ Thông Tin', 'Trí Tuệ Nhân Tạo', NULL, 'Tiến sĩ AI, giảng viên hàng đầu', ARRAY['20+ bài báo', 'Leader team AI'], NOW() - INTERVAL '210 days', NOW()),
  ('mentor007', 'Đinh Hoa G', 'mentor.g@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentor007', 'MENTOR', 'Khoa Kỹ Thuật', 'Quản Lý Dự Án', NULL, 'PMP, PMI, quản lý dự án 15 năm', ARRAY['Quản lý 50+ dự án', 'Huấn luyện viên'], NOW() - INTERVAL '170 days', NOW()),
  ('mentor008', 'Tường Vy H', 'mentor.h@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentor008', 'MENTOR', 'Khoa Công Nghệ Thông Tin', 'Giao Dịch Điện Tử', NULL, 'Expert fintech, blockchain developer', ARRAY['Startup blockchain', 'Công ty fintech'], NOW() - INTERVAL '195 days', NOW()),
  ('mentor009', 'Bạch Minh I', 'mentor.i@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentor009', 'MENTOR', 'Khoa Công Nghệ Thông Tin', 'Phân Tích Dữ Liệu', NULL, 'Data scientist, phân tích big data', ARRAY['5 startup', '2M data points'], NOW() - INTERVAL '185 days', NOW()),
  ('mentor010', 'Nhân Đức J', 'mentor.j@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentor010', 'MENTOR', 'Khoa Kỹ Thuật', 'DevOps và Cloud', NULL, 'AWS Solutions Architect, DevOps lead', ARRAY['AWS Certified', 'Quản lý cloud'], NOW() - INTERVAL '205 days', NOW());

-- ==================== USERS - MENTEES ====================
INSERT INTO "User" (id, name, email, image, role, department, major, year, bio, achievements, "createdAt", "updatedAt")
VALUES
  ('mentee001', 'Trần Nhân 1', 'mentee1@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee001', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Kỹ Thuật Phần Mềm', 3, 'Sinh viên năm 3, đam mê lập trình', ARRAY['Giải Ba Hackathon'], NOW() - INTERVAL '150 days', NOW()),
  ('mentee002', 'Lê Minh Khoa', 'mentee2@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee002', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Khoa Học Máy Tính', 2, 'Hứng thú với AI', ARRAY[''], NOW() - INTERVAL '160 days', NOW()),
  ('mentee003', 'Phạm Quỳnh Anh', 'mentee3@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee003', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'An Toàn Thông Tin', 2, 'Quan tâm an ninh mạng', ARRAY[''], NOW() - INTERVAL '155 days', NOW()),
  ('mentee004', 'Hoàng Văn Mạnh', 'mentee4@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee004', 'MENTEE', 'Khoa Kỹ Thuật', 'Hệ Thống Thông Tin', 3, 'Muốn trở thành kiến trúc sư', ARRAY[''], NOW() - INTERVAL '145 days', NOW()),
  ('mentee005', 'Ngô Thanh Tú', 'mentee5@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee005', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Phát Triển Web', 1, 'Mới học, muốn chuyên Web', ARRAY[''], NOW() - INTERVAL '170 days', NOW()),
  ('mentee006', 'Đặng Thanh Linh', 'mentee6@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee006', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Phát Triển Web', 2, 'Frontend developer wannabe', ARRAY[''], NOW() - INTERVAL '140 days', NOW()),
  ('mentee007', 'Bùi Minh Tuấn', 'mentee7@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee007', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Trí Tuệ Nhân Tạo', 3, 'Học AI nhưng còn yếu', ARRAY[''], NOW() - INTERVAL '165 days', NOW()),
  ('mentee008', 'Võ Tú Anh', 'mentee8@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee008', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Giao Dịch Điện Tử', 2, 'Đam mê fintech', ARRAY[''], NOW() - INTERVAL '158 days', NOW()),
  ('mentee009', 'Khuất Quang Huy', 'mentee9@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee009', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Phân Tích Dữ Liệu', 2, 'Thích phân tích dữ liệu', ARRAY[''], NOW() - INTERVAL '152 days', NOW()),
  ('mentee010', 'Nông Hoàng Phúc', 'mentee10@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee010', 'MENTEE', 'Khoa Kỹ Thuật', 'DevOps và Cloud', 1, 'Quan tâm cloud computing', ARRAY[''], NOW() - INTERVAL '148 days', NOW()),
  ('mentee011', 'Mã Văn Hiền', 'mentee11@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee011', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Kỹ Thuật Phần Mềm', 2, 'Muốn học React', ARRAY[''], NOW() - INTERVAL '175 days', NOW()),
  ('mentee012', 'Trịnh Hoa Bình', 'mentee12@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee012', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Kỹ Thuật Phần Mềm', 3, 'Chuẩn bị ra trường', ARRAY['Internship Grab'], NOW() - INTERVAL '162 days', NOW()),
  ('mentee013', 'Đỗ Tuấn Minh', 'mentee13@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee013', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'An Toàn Thông Tin', 1, 'Mới vào đại học', ARRAY[''], NOW() - INTERVAL '138 days', NOW()),
  ('mentee014', 'Hà Thúy Kiều', 'mentee14@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee014', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Khoa Học Máy Tính', 2, 'Passionate learner', ARRAY[''], NOW() - INTERVAL '168 days', NOW()),
  ('mentee015', 'Vũ Hoàng Nam', 'mentee15@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee015', 'MENTEE', 'Khoa Kỹ Thuật', 'Hệ Thống Thông Tin', 2, 'Quan tâm Infrastructure', ARRAY[''], NOW() - INTERVAL '155 days', NOW()),
  ('mentee016', 'Tô Thanh Hương', 'mentee16@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee016', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Phát Triển Web', 3, 'Senior mentee', ARRAY[''], NOW() - INTERVAL '180 days', NOW()),
  ('mentee017', 'Đinh Văn Thắng', 'mentee17@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee017', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Trí Tuệ Nhân Tạo', 1, 'Beginner in AI', ARRAY[''], NOW() - INTERVAL '142 days', NOW()),
  ('mentee018', 'Lưu Thanh Hòa', 'mentee18@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee018', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Phân Tích Dữ Liệu', 2, 'Learning data analysis', ARRAY[''], NOW() - INTERVAL '158 days', NOW()),
  ('mentee019', 'Nguyễn Hồ Minh', 'mentee19@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee019', 'MENTEE', 'Khoa Kỹ Thuật', 'DevOps và Cloud', 3, 'Advanced learner', ARRAY['AWS course'], NOW() - INTERVAL '145 days', NOW()),
  ('mentee020', 'Châu Minh Anh', 'mentee20@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=mentee020', 'MENTEE', 'Khoa Công Nghệ Thông Tin', 'Giao Dịch Điện Tử', 2, 'Fintech enthusiast', ARRAY[''], NOW() - INTERVAL '170 days', NOW());

-- ==================== USERS - ADMIN ====================
INSERT INTO "User" (id, name, email, image, role, department, major, year, bio, achievements, "createdAt", "updatedAt")
VALUES
  ('admin001', 'Admin Hệ Thống', 'admin@example.com', 'https://api.dicebear.com/9.x/avataaars/png?seed=admin001', 'ADMIN', NULL, NULL, NULL, 'Quản trị viên hệ thống', ARRAY[''], NOW() - INTERVAL '300 days', NOW());

-- ==================== MENTOR PROFILES ====================
INSERT INTO "MentorProfile" (id, "userId", rating, "totalReviews", expertise, "maxMentees", "availableDays", "createdAt", "updatedAt")
VALUES
  ('mp001', 'mentor001', 4.8, 25, ARRAY['Java', 'Spring Boot', 'Microservices', 'Design Patterns'], 5, ARRAY['Thứ Hai', 'Thứ Ba', 'Thứ Năm'], NOW() - INTERVAL '180 days', NOW()),
  ('mp002', 'mentor002', 4.9, 32, ARRAY['Python', 'TensorFlow', 'PyTorch', 'Deep Learning'], 4, ARRAY['Thứ Tư', 'Thứ Sáu', 'Thứ Bảy'], NOW() - INTERVAL '200 days', NOW()),
  ('mp003', 'mentor003', 4.7, 18, ARRAY['Network Security', 'Ethical Hacking', 'Cryptography'], 3, ARRAY['Thứ Hai', 'Thứ Tư'], NOW() - INTERVAL '220 days', NOW()),
  ('mp004', 'mentor004', 4.9, 28, ARRAY['System Architecture', 'Database Design', 'Scalability'], 5, ARRAY['Thứ Ba', 'Thứ Năm', 'Chủ Nhật'], NOW() - INTERVAL '240 days', NOW()),
  ('mp005', 'mentor005', 4.8, 22, ARRAY['React', 'Node.js', 'MongoDB', 'Full-stack'], 5, ARRAY['Thứ Hai', 'Thứ Tư', 'Thứ Sáu'], NOW() - INTERVAL '190 days', NOW()),
  ('mp006', 'mentor006', 4.9, 35, ARRAY['Machine Learning', 'Computer Vision', 'NLP'], 4, ARRAY['Thứ Ba', 'Thứ Năm', 'Chủ Nhật'], NOW() - INTERVAL '210 days', NOW()),
  ('mp007', 'mentor007', 4.6, 15, ARRAY['Project Management', 'Agile', 'Scrum'], 6, ARRAY['Thứ Tư', 'Thứ Sáu', 'Thứ Bảy'], NOW() - INTERVAL '170 days', NOW()),
  ('mp008', 'mentor008', 4.8, 24, ARRAY['Blockchain', 'Smart Contracts', 'Cryptocurrency'], 4, ARRAY['Thứ Hai', 'Thứ Năm', 'Chủ Nhật'], NOW() - INTERVAL '195 days', NOW()),
  ('mp009', 'mentor009', 4.7, 20, ARRAY['Data Analysis', 'SQL', 'Tableau', 'Power BI'], 5, ARRAY['Thứ Tư', 'Thứ Sáu', 'Thứ Bảy'], NOW() - INTERVAL '185 days', NOW()),
  ('mp010', 'mentor010', 4.8, 26, ARRAY['AWS', 'Docker', 'Kubernetes', 'CI/CD'], 5, ARRAY['Thứ Hai', 'Thứ Tư', 'Thứ Bảy'], NOW() - INTERVAL '205 days', NOW());

-- ==================== MENTEE CONNECTIONS ====================
INSERT INTO "MenteeConnection" (id, "menteeId", "mentorId", status, "createdAt", "updatedAt")
VALUES
  ('conn001', 'mentee001', 'mentor001', 'ACCEPTED', NOW() - INTERVAL '120 days', NOW()),
  ('conn002', 'mentee002', 'mentor002', 'ACCEPTED', NOW() - INTERVAL '130 days', NOW()),
  ('conn003', 'mentee003', 'mentor003', 'ACCEPTED', NOW() - INTERVAL '125 days', NOW()),
  ('conn004', 'mentee004', 'mentor004', 'ACCEPTED', NOW() - INTERVAL '110 days', NOW()),
  ('conn005', 'mentee005', 'mentor005', 'ACCEPTED', NOW() - INTERVAL '140 days', NOW()),
  ('conn006', 'mentee006', 'mentor005', 'ACCEPTED', NOW() - INTERVAL '135 days', NOW()),
  ('conn007', 'mentee007', 'mentor006', 'ACCEPTED', NOW() - INTERVAL '145 days', NOW()),
  ('conn008', 'mentee008', 'mentor008', 'ACCEPTED', NOW() - INTERVAL '128 days', NOW()),
  ('conn009', 'mentee009', 'mentor009', 'ACCEPTED', NOW() - INTERVAL '132 days', NOW()),
  ('conn010', 'mentee010', 'mentor010', 'ACCEPTED', NOW() - INTERVAL '118 days', NOW()),
  ('conn011', 'mentee011', 'mentor001', 'ACCEPTED', NOW() - INTERVAL '145 days', NOW()),
  ('conn012', 'mentee012', 'mentor005', 'ACCEPTED', NOW() - INTERVAL '142 days', NOW()),
  ('conn013', 'mentee013', 'mentor003', 'PENDING', NOW() - INTERVAL '8 days', NOW()),
  ('conn014', 'mentee014', 'mentor002', 'ACCEPTED', NOW() - INTERVAL '148 days', NOW()),
  ('conn015', 'mentee015', 'mentor004', 'PENDING', NOW() - INTERVAL '5 days', NOW()),
  ('conn016', 'mentee016', 'mentor005', 'ACCEPTED', NOW() - INTERVAL '160 days', NOW()),
  ('conn017', 'mentee017', 'mentor006', 'ACCEPTED', NOW() - INTERVAL '122 days', NOW()),
  ('conn018', 'mentee018', 'mentor009', 'ACCEPTED', NOW() - INTERVAL '138 days', NOW()),
  ('conn019', 'mentee019', 'mentor010', 'ACCEPTED', NOW() - INTERVAL '125 days', NOW()),
  ('conn020', 'mentee020', 'mentor008', 'ACCEPTED', NOW() - INTERVAL '150 days', NOW());

-- ==================== POSTS ====================
INSERT INTO "Post" (id, content, images, published, "authorId", "createdAt", "updatedAt")
VALUES
  ('post001', 'Hôm nay tôi vừa hoàn thành dự án React đầu tiên! 🎉 Cảm ơn mentor của tôi đã giúp đỡ rất nhiều.', ARRAY['https://via.placeholder.com/400'], true, 'mentee001', NOW() - INTERVAL '10 days', NOW()),
  ('post002', 'Tips học Machine Learning hiệu quả: 1. Hiểu lý thuyết 2. Code từ đầu 3. Thực hành liên tục 4. Đọc papers', ARRAY[], true, 'mentor002', NOW() - INTERVAL '5 days', NOW()),
  ('post003', 'Mới hoàn thành khóa DevOps, giờ có thể deploy ứng dụng mà không sợ lỗi 😄', ARRAY[], true, 'mentee010', NOW() - INTERVAL '7 days', NOW()),
  ('post004', 'Startup của tôi vừa nhận được Series A funding! Hết sức vui vẻ 🚀', ARRAY[], true, 'mentor004', NOW() - INTERVAL '3 days', NOW()),
  ('post005', 'Chia sẻ 10 best practices khi viết code sạch - phần 1', ARRAY[], true, 'mentor001', NOW() - INTERVAL '8 days', NOW()),
  ('post006', 'Đạt 4.0 GPA trong kỳ này! Cảm ơn các mentor đã hỗ trợ 💪', ARRAY[], true, 'mentee006', NOW() - INTERVAL '12 days', NOW()),
  ('post007', 'Bảo mật web application - những sai lầm phổ biến', ARRAY[], true, 'mentor003', NOW() - INTERVAL '6 days', NOW()),
  ('post008', 'Lần đầu tiên tham gia Hackathon, rất haha nhưng cũng học được nhiều', ARRAY['https://via.placeholder.com/400'], true, 'mentee005', NOW() - INTERVAL '14 days', NOW()),
  ('post009', 'Công nghệ blockchain sẽ thay đổi thế giới tài chính', ARRAY[], true, 'mentor008', NOW() - INTERVAL '9 days', NOW()),
  ('post010', 'Xin lỗi vì không có bài viết gì lâu rồi, mình bận với project. Sắp share kinh nghiệm', ARRAY[], true, 'mentee012', NOW() - INTERVAL '20 days', NOW()),
  ('post011', 'Big Data không phải là lớn mà là giá trị thông tin bạn tìm ra được', ARRAY[], true, 'mentor009', NOW() - INTERVAL '4 days', NOW()),
  ('post012', 'Docker + Kubernetes = vạn năng? Không phải nhưng khá là mạnh!', ARRAY[], true, 'mentor010', NOW() - INTERVAL '11 days', NOW());

-- ==================== REVIEWS ====================
INSERT INTO "Review" (id, "reviewerId", "mentorId", rating, comment, "createdAt")
VALUES
  ('review001', 'mentee001', 'mentor001', 5, 'Nguyễn Văn A là mentor tuyệt vời! Rất kiên nhẫn và giải thích chi tiết.', NOW() - INTERVAL '30 days'),
  ('review002', 'mentee002', 'mentor002', 5, 'Trần Thị B giáo dạy rất chuyên sâu về AI. Khuyến khích ai muốn học AI.', NOW() - INTERVAL '45 days'),
  ('review003', 'mentee003', 'mentor003', 4, 'Lê Minh C hiểu sâu về bảo mật. Chỉ là lúc nào cũng bận nên khó match.', NOW() - INTERVAL '35 days'),
  ('review004', 'mentee004', 'mentor004', 5, 'Phạm Quốc D là kiến trúc sư tuyệt vời! Giáo dạy rất thực tế.', NOW() - INTERVAL '50 days'),
  ('review005', 'mentee005', 'mentor005', 5, 'Hoàng Thu E dạy React rất dễ hiểu. Project đầu tiên của tôi thành công!', NOW() - INTERVAL '40 days'),
  ('review006', 'mentee006', 'mentor005', 4, 'Dạy tốt nhưng cần cải thiện tốc độ phản hồi.', NOW() - INTERVAL '42 days'),
  ('review007', 'mentee007', 'mentor006', 5, 'Tiến sĩ AI, giáo dạy rất chuyên nghiệp. Nhiều kiến thức quý giá!', NOW() - INTERVAL '48 days'),
  ('review008', 'mentee008', 'mentor008', 5, 'Blockchain expert tuyệt vời. Giải thích công nghệ khó một cách dễ hiểu.', NOW() - INTERVAL '38 days'),
  ('review009', 'mentee009', 'mentor009', 4, 'Mentor tốt, chỉ là bận work nên không thường xuyên.', NOW() - INTERVAL '44 days'),
  ('review010', 'mentee010', 'mentor010', 5, 'AWS expert! Tôi đã từ newbie thành intermediate sau 3 tháng.', NOW() - INTERVAL '36 days');

-- ==================== MENTOR FEEDBACK ====================
INSERT INTO "MentorFeedback" (id, "mentorId", "menteeId", score, comment, "createdAt")
VALUES
  ('fb001', 'mentor001', 'mentee001', 85, 'Tiến độ tốt, cần cải thiện kỹ năng giải quyết vấn đề phức tạp', NOW() - INTERVAL '15 days'),
  ('fb002', 'mentor002', 'mentee002', 78, 'Cơ sở lý thuyết chưa vững, cần ôn tập toán cao cấp', NOW() - INTERVAL '10 days'),
  ('fb003', 'mentor003', 'mentee003', 88, 'Rất tích cực, hiểu sâu về network security', NOW() - INTERVAL '12 days'),
  ('fb004', 'mentor004', 'mentee004', 82, 'Thiết kế tốt nhưng cần thực hành implementation', NOW() - INTERVAL '20 days'),
  ('fb005', 'mentor005', 'mentee005', 90, 'Học React rất nhanh, có tiềm năng làm frontend developer', NOW() - INTERVAL '8 days'),
  ('fb006', 'mentor005', 'mentee006', 84, 'Tiến độ ổn, cần chú ý hơn đến code quality', NOW() - INTERVAL '18 days'),
  ('fb007', 'mentor006', 'mentee007', 81, 'Nền tảng tốt nhưng chưa áp dụng vào thực tế', NOW() - INTERVAL '14 days'),
  ('fb008', 'mentor008', 'mentee008', 87, 'Hiểu blockchain tốt, cần học thêm về smart contracts', NOW() - INTERVAL '11 days'),
  ('fb009', 'mentor009', 'mentee009', 79, 'SQL tốt nhưng chậm trong phân tích dữ liệu', NOW() - INTERVAL '16 days'),
  ('fb010', 'mentor010', 'mentee010', 92, 'Xuất sắc! Sẵn sàng cho level cao hơn', NOW() - INTERVAL '9 days');

-- ==================== PROGRESS RECORDS ====================
INSERT INTO "ProgressRecord" (id, "menteeId", category, subcategory, score, "maxScore", notes, "recordedBy", "recordType", tags, "createdAt", "updatedAt")
VALUES
  ('prog001', 'mentee001', 'coding', 'java', 78, 100, 'Nắm vững OOP', 'mentor001', 'MANUAL', ARRAY['good-progress'], NOW() - INTERVAL '5 days', NOW()),
  ('prog002', 'mentee001', 'problem_solving', 'algorithms', 72, 100, 'Cần học thêm dynamic programming', 'mentor001', 'MANUAL', ARRAY['need-improvement'], NOW() - INTERVAL '3 days', NOW()),
  ('prog003', 'mentee002', 'coding', 'python', 85, 100, 'Viết Python rất tốt', 'mentor002', 'MANUAL', ARRAY['excellent'], NOW() - INTERVAL '4 days', NOW()),
  ('prog004', 'mentee002', 'problem_solving', 'ml', 75, 100, 'Hiểu ML concept nhưng chưa áp dụng tốt', 'mentor002', 'MANUAL', ARRAY['learning'], NOW() - INTERVAL '2 days', NOW()),
  ('prog005', 'mentee003', 'coding', 'network', 80, 100, 'Hiểu network protocol', 'mentor003', 'MANUAL', ARRAY['good-progress'], NOW() - INTERVAL '6 days', NOW()),
  ('prog006', 'mentee004', 'coding', 'architecture', 82, 100, 'Thiết kế hệ thống tốt', 'mentor004', 'MANUAL', ARRAY['excellent'], NOW() - INTERVAL '7 days', NOW()),
  ('prog007', 'mentee005', 'coding', 'react', 88, 100, 'Nắm rõ React hooks', 'mentor005', 'MANUAL', ARRAY['excellent'], NOW() - INTERVAL '5 days', NOW()),
  ('prog008', 'mentee006', 'coding', 'react', 82, 100, 'Nên viết code sạch hơn', 'mentor005', 'MANUAL', ARRAY['good-progress'], NOW() - INTERVAL '4 days', NOW()),
  ('prog009', 'mentee007', 'coding', 'tensorflow', 76, 100, 'TensorFlow basics ổn', 'mentor006', 'MANUAL', ARRAY['learning'], NOW() - INTERVAL '8 days', NOW()),
  ('prog010', 'mentee008', 'coding', 'solidity', 84, 100, 'Viết smart contract tốt', 'mentor008', 'MANUAL', ARRAY['good-progress'], NOW() - INTERVAL '6 days', NOW()),
  ('prog011', 'mentee009', 'coding', 'sql', 87, 100, 'SQL advanced ổn', 'mentor009', 'MANUAL', ARRAY['excellent'], NOW() - INTERVAL '5 days', NOW()),
  ('prog012', 'mentee010', 'coding', 'docker', 90, 100, 'Docker/K8s master', 'mentor010', 'MANUAL', ARRAY['excellent'], NOW() - INTERVAL '4 days', NOW()),
  ('prog013', 'mentee011', 'communication', 'presentation', 70, 100, 'Cần cải thiện kỹ năng thuyết trình', 'mentor001', 'MANUAL', ARRAY['need-improvement'], NOW() - INTERVAL '10 days', NOW()),
  ('prog014', 'mentee012', 'teamwork', 'collaboration', 85, 100, 'Làm việc nhóm rất tốt', 'mentor005', 'MANUAL', ARRAY['excellent'], NOW() - INTERVAL '9 days', NOW());

-- ==================== CALENDAR EVENTS ====================
INSERT INTO "CalendarEvent" (id, title, description, "startTime", "endTime", type, priority, location, "isCompleted", "creatorId", "createdAt", "updatedAt")
VALUES
  ('event001', 'Session 1: Giới thiệu Java cơ bản', 'Tìm hiểu về JVM, syntactic basics', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '2 hours', 'MEETING', 'HIGH', 'Online Zoom', true, 'mentor001', NOW() - INTERVAL '40 days', NOW()),
  ('event002', 'Session 2: Object-Oriented Programming', 'Lớp, đối tượng, kế thừa, đa hình', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '2 hours', 'MEETING', 'HIGH', 'Online Zoom', true, 'mentor001', NOW() - INTERVAL '30 days', NOW()),
  ('event003', 'Deadline: Java Project 1', 'Nộp project về Java basics', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'DEADLINE', 'URGENT', 'Platform', true, 'mentor001', NOW() - INTERVAL '20 days', NOW()),
  ('event004', 'Python for AI Workshop', 'Hands-on Python workshop cho AI/ML', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '3 hours', 'CLASS', 'HIGH', 'Online Zoom', false, 'mentor002', NOW(), NOW()),
  ('event005', 'Code Review: Mentee Projects', 'Review code của mentees', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days' + INTERVAL '1 hour', 'MEETING', 'MEDIUM', 'Online', false, 'mentor001', NOW(), NOW()),
  ('event006', 'React Basics Tutorial', 'Giới thiệu React components và hooks', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days' + INTERVAL '2 hours', 'CLASS', 'HIGH', 'Online', true, 'mentor005', NOW() - INTERVAL '25 days', NOW()),
  ('event007', 'Final Project Presentation', 'Thuyết trình dự án cuối kỳ', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '1 hour', 'EXAM', 'URGENT', 'Room 305', false, 'mentor001', NOW() - INTERVAL '5 days', NOW()),
  ('event008', 'Security Audit Workshop', 'Học cách audit bảo mật ứng dụng', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '2 hours', 'CLASS', 'HIGH', 'Online', true, 'mentor003', NOW() - INTERVAL '15 days', NOW()),
  ('event009', 'Blockchain Discussion', 'Thảo luận về công nghệ blockchain', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1.5 hours', 'MEETING', 'MEDIUM', 'Online Zoom', false, 'mentor008', NOW() - INTERVAL '2 days', NOW()),
  ('event010', 'Data Analysis Capstone', 'Project cuối cùng phân tích dữ liệu', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days', 'DEADLINE', 'HIGH', 'Platform', false, 'mentor009', NOW() - INTERVAL '8 days', NOW()),
  ('event011', 'DevOps Best Practices', 'CI/CD pipeline, monitoring, logging', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days' + INTERVAL '2 hours', 'CLASS', 'HIGH', 'Online', true, 'mentor010', NOW() - INTERVAL '20 days', NOW()),
  ('event012', 'Mentee Check-in Meeting', 'Kiểm tra tiến độ tổng quát', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '30 minutes', 'MEETING', 'MEDIUM', 'Online', false, 'mentor004', NOW(), NOW());

-- ==================== EVENT ASSIGNMENTS ====================
INSERT INTO "EventAssignment" (id, "eventId", "userId", status, "createdAt", "updatedAt")
VALUES
  ('ea001', 'event001', 'mentee001', 'COMPLETED', NOW() - INTERVAL '30 days', NOW()),
  ('ea002', 'event002', 'mentee001', 'COMPLETED', NOW() - INTERVAL '20 days', NOW()),
  ('ea003', 'event003', 'mentee001', 'COMPLETED', NOW() - INTERVAL '10 days', NOW()),
  ('ea004', 'event004', 'mentee002', 'PENDING', NOW(), NOW()),
  ('ea005', 'event004', 'mentee014', 'PENDING', NOW(), NOW()),
  ('ea006', 'event005', 'mentee001', 'PENDING', NOW(), NOW()),
  ('ea007', 'event005', 'mentee011', 'PENDING', NOW(), NOW()),
  ('ea008', 'event006', 'mentee005', 'COMPLETED', NOW() - INTERVAL '15 days', NOW()),
  ('ea009', 'event006', 'mentee006', 'COMPLETED', NOW() - INTERVAL '15 days', NOW()),
  ('ea010', 'event006', 'mentee016', 'COMPLETED', NOW() - INTERVAL '15 days', NOW()),
  ('ea011', 'event007', 'mentee001', 'PENDING', NOW() - INTERVAL '5 days', NOW()),
  ('ea012', 'event007', 'mentee012', 'PENDING', NOW() - INTERVAL '5 days', NOW()),
  ('ea013', 'event008', 'mentee003', 'COMPLETED', NOW() - INTERVAL '8 days', NOW()),
  ('ea014', 'event009', 'mentee008', 'PENDING', NOW() - INTERVAL '2 days', NOW()),
  ('ea015', 'event010', 'mentee009', 'PENDING', NOW() - INTERVAL '8 days', NOW()),
  ('ea016', 'event010', 'mentee018', 'PENDING', NOW() - INTERVAL '8 days', NOW()),
  ('ea017', 'event011', 'mentee010', 'COMPLETED', NOW() - INTERVAL '12 days', NOW()),
  ('ea018', 'event011', 'mentee019', 'COMPLETED', NOW() - INTERVAL '12 days', NOW()),
  ('ea019', 'event012', 'mentee001', 'PENDING', NOW(), NOW()),
  ('ea020', 'event012', 'mentee004', 'PENDING', NOW(), NOW());

-- ==================== CHAT SERVERS ====================
INSERT INTO "ChatServer" (id, name, description, image, "ownerId", "createdAt", "updatedAt")
VALUES
  ('server001', 'Nhóm Lập Trình Java', 'Thảo luận về Java, Spring Boot, Microservices', 'https://via.placeholder.com/100', 'mentor001', NOW() - INTERVAL '90 days', NOW()),
  ('server002', 'AI & Machine Learning Enthusiasts', 'Cộng đồng AI/ML learners', 'https://via.placeholder.com/100', 'mentor002', NOW() - INTERVAL '80 days', NOW()),
  ('server003', 'Web Development Squad', 'React, Node.js, Frontend backend discussions', 'https://via.placeholder.com/100', 'mentor005', NOW() - INTERVAL '85 days', NOW()),
  ('server004', 'Security & DevOps', 'Bảo mật, DevOps, Cloud Infrastructure', 'https://via.placeholder.com/100', 'mentor010', NOW() - INTERVAL '75 days', NOW()),
  ('server005', 'Data Science Hub', 'Phân tích dữ liệu, visualization, analytics', 'https://via.placeholder.com/100', 'mentor009', NOW() - INTERVAL '70 days', NOW());

-- ==================== CHANNELS ====================
INSERT INTO "Channel" (id, name, type, description, "serverId", "createdAt", "updatedAt")
VALUES
  ('ch001', 'general', 'TEXT', 'Thảo luận chung', 'server001', NOW() - INTERVAL '90 days', NOW()),
  ('ch002', 'spring-boot', 'TEXT', 'Thảo luận Spring Boot', 'server001', NOW() - INTERVAL '88 days', NOW()),
  ('ch003', 'projects', 'TEXT', 'Chia sẻ projects', 'server001', NOW() - INTERVAL '87 days', NOW()),
  ('ch004', 'general', 'TEXT', 'Thảo luận chung', 'server002', NOW() - INTERVAL '80 days', NOW()),
  ('ch005', 'tensorflow', 'TEXT', 'TensorFlow discussions', 'server002', NOW() - INTERVAL '79 days', NOW()),
  ('ch006', 'resources', 'TEXT', 'Tài nguyên học tập', 'server002', NOW() - INTERVAL '78 days', NOW()),
  ('ch007', 'general', 'TEXT', 'Thảo luận chung', 'server003', NOW() - INTERVAL '85 days', NOW()),
  ('ch008', 'react', 'TEXT', 'React discussions', 'server003', NOW() - INTERVAL '84 days', NOW()),
  ('ch009', 'backend', 'TEXT', 'Backend với Node.js', 'server003', NOW() - INTERVAL '83 days', NOW()),
  ('ch010', 'general', 'TEXT', 'Thảo luận chung', 'server004', NOW() - INTERVAL '75 days', NOW()),
  ('ch011', 'security', 'TEXT', 'Bảo mật thảo luận', 'server004', NOW() - INTERVAL '74 days', NOW()),
  ('ch012', 'devops', 'TEXT', 'DevOps & Infrastructure', 'server004', NOW() - INTERVAL '73 days', NOW()),
  ('ch013', 'general', 'TEXT', 'Thảo luận chung', 'server005', NOW() - INTERVAL '70 days', NOW()),
  ('ch014', 'analysis', 'TEXT', 'Data Analysis projects', 'server005', NOW() - INTERVAL '69 days', NOW()),
  ('ch015', 'visualization', 'TEXT', 'Data Visualization', 'server005', NOW() - INTERVAL '68 days', NOW());

-- ==================== SERVER MEMBERS ====================
INSERT INTO "ServerMember" (id, "serverId", "userId", role, "createdAt", "updatedAt")
VALUES
  ('sm001', 'server001', 'mentor001', 'OWNER', NOW() - INTERVAL '90 days', NOW()),
  ('sm002', 'server001', 'mentee001', 'MEMBER', NOW() - INTERVAL '88 days', NOW()),
  ('sm003', 'server001', 'mentee011', 'MEMBER', NOW() - INTERVAL '87 days', NOW()),
  ('sm004', 'server002', 'mentor002', 'OWNER', NOW() - INTERVAL '80 days', NOW()),
  ('sm005', 'server002', 'mentee002', 'MEMBER', NOW() - INTERVAL '79 days', NOW()),
  ('sm006', 'server002', 'mentee014', 'MEMBER', NOW() - INTERVAL '78 days', NOW()),
  ('sm007', 'server003', 'mentor005', 'OWNER', NOW() - INTERVAL '85 days', NOW()),
  ('sm008', 'server003', 'mentee005', 'MEMBER', NOW() - INTERVAL '84 days', NOW()),
  ('sm009', 'server003', 'mentee006', 'MEMBER', NOW() - INTERVAL '83 days', NOW()),
  ('sm010', 'server003', 'mentee016', 'MEMBER', NOW() - INTERVAL '82 days', NOW()),
  ('sm011', 'server004', 'mentor010', 'OWNER', NOW() - INTERVAL '75 days', NOW()),
  ('sm012', 'server004', 'mentee010', 'MEMBER', NOW() - INTERVAL '74 days', NOW()),
  ('sm013', 'server004', 'mentee019', 'MEMBER', NOW() - INTERVAL '73 days', NOW()),
  ('sm014', 'server005', 'mentor009', 'OWNER', NOW() - INTERVAL '70 days', NOW()),
  ('sm015', 'server005', 'mentee009', 'MEMBER', NOW() - INTERVAL '69 days', NOW()),
  ('sm016', 'server005', 'mentee018', 'MEMBER', NOW() - INTERVAL '68 days', NOW());

-- ==================== MESSAGES ====================
INSERT INTO "Message" (id, content, type, "authorId", "channelId", "createdAt", "updatedAt")
VALUES
  ('msg001', 'Chào mọi người! Mình vừa mới join server này 👋', 'TEXT', 'mentee001', 'ch001', NOW() - INTERVAL '30 days', NOW()),
  ('msg002', 'Chào bạn! Chào mừng bạn đến với nhóm Java', 'TEXT', 'mentor001', 'ch001', NOW() - INTERVAL '29 days', NOW()),
  ('msg003', 'Ai giúp tôi với Spring Boot annotations không?', 'TEXT', 'mentee001', 'ch002', NOW() - INTERVAL '25 days', NOW()),
  ('msg004', '@mentee001 @Autowired, @Configuration, @Bean là những annotation hay dùng nhất', 'TEXT', 'mentor001', 'ch002', NOW() - INTERVAL '25 days', NOW()),
  ('msg005', 'Mình vừa hoàn thành dự án Spring Boot đầu tiên! 🎉', 'TEXT', 'mentee001', 'ch003', NOW() - INTERVAL '15 days', NOW()),
  ('msg006', 'Chúc mừng bạn! Có thể share link GitHub không?', 'TEXT', 'mentor001', 'ch003', NOW() - INTERVAL '14 days', NOW()),
  ('msg007', 'Ai có kinh nghiệm với TensorFlow không?', 'TEXT', 'mentee002', 'ch005', NOW() - INTERVAL '12 days', NOW()),
  ('msg008', 'Mình sử dụng TensorFlow 2.x, có thể giúp bạn', 'TEXT', 'mentor002', 'ch005', NOW() - INTERVAL '11 days', NOW()),
  ('msg009', 'React hooks khó quá! Ai có thể giải thích không?', 'TEXT', 'mentee005', 'ch008', NOW() - INTERVAL '8 days', NOW()),
  ('msg010', 'Hooks là cách để sử dụng state trong functional components', 'TEXT', 'mentor005', 'ch008', NOW() - INTERVAL '7 days', NOW()),
  ('msg011', 'Ai biết về Docker không? Tôi mới bắt đầu học', 'TEXT', 'mentee010', 'ch012', NOW() - INTERVAL '5 days', NOW()),
  ('msg012', 'Docker là công nghệ containerization rất hữu ích', 'TEXT', 'mentor010', 'ch012', NOW() - INTERVAL '4 days', NOW()),
  ('msg013', 'Mình vừa hoàn thành data analysis project 📊', 'TEXT', 'mentee009', 'ch014', NOW() - INTERVAL '3 days', NOW()),
  ('msg014', 'Tuyệt vời! Có thể thuyết trình kết quả không?', 'TEXT', 'mentor009', 'ch014', NOW() - INTERVAL '2 days', NOW()),
  ('msg015', 'Mọi người có câu hỏi không? Bạn có thể task ở đây', 'TEXT', 'mentor001', 'ch001', NOW() - INTERVAL '1 day', NOW());

-- ==================== RE-ENABLE FOREIGN KEY CONSTRAINTS ====================
SET session_replication_role = 'default';

-- ==================== VERIFY DATA ====================
SELECT 
  (SELECT COUNT(*) FROM "User") as total_users,
  (SELECT COUNT(*) FROM "User" WHERE role = 'MENTOR') as total_mentors,
  (SELECT COUNT(*) FROM "User" WHERE role = 'MENTEE') as total_mentees,
  (SELECT COUNT(*) FROM "MentorProfile") as mentor_profiles,
  (SELECT COUNT(*) FROM "MenteeConnection" WHERE status = 'ACCEPTED') as accepted_connections,
  (SELECT COUNT(*) FROM "Post") as total_posts,
  (SELECT COUNT(*) FROM "Review") as total_reviews,
  (SELECT COUNT(*) FROM "MentorFeedback") as total_feedbacks,
  (SELECT COUNT(*) FROM "ProgressRecord") as total_progress,
  (SELECT COUNT(*) FROM "CalendarEvent") as total_events,
  (SELECT COUNT(*) FROM "Message") as total_messages,
  (SELECT COUNT(*) FROM "ChatServer") as total_servers;
