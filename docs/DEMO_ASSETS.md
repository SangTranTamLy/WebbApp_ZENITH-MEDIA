# Demo media

Sáu ảnh raster được tạo bằng công cụ ImageGen tích hợp, ngày 2026-11-10. Dùng làm minh họa cho catalog cục bộ; không phải ảnh sản phẩm thương mại đã có của cửa hàng. Những thumbnails cũ trong repository là blob rỗng nên không dùng được.

| File gốc                            | Nội dung tạo                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| `demo-assets/studio-demo.png`       | Study trừu tượng về kính lavender óng ánh và dải kim loại bạc, bố cục điện ảnh, không chữ/nhãn hiệu |
| `demo-assets/studio-demo-2.png`     | Phố Tokyo hư cấu sau mưa giờ xanh, xe thể thao và phản xạ đèn, không logo hay biển hiệu đọc được    |
| `demo-assets/studio-demo-3.png`     | Macro ánh sáng lăng kính/light leak, nền tối, màu sắc điện ảnh, không chữ                           |
| `demo-assets/kinetic-type.png`      | Typography MOTION chạy theo phối cảnh, nền lavender và quả cầu chrome                               |
| `demo-assets/motion-collection.png` | Vòng chrome trên mặt hồ, trăng lavender và núi lúc bình minh                                        |
| `demo-assets/violet-iris.png`       | Macro các cánh kính tím và hạt thủy ngân, ánh sáng mềm                                              |

Đây là bản mô tả tóm tắt prompt, không phải log nguyên văn. File PNG gốc nằm trong repo; `scripts/prepare-demo.mjs` tạo cover JPEG, video sample có chữ “ZENITH MEDIA DEMO” và ZIP có README bằng FFmpeg/Python. Script không chỉnh sửa PNG gốc. Không có URL hotlink tới tài sản bên thứ ba.

`preview.mp4` chỉ là clip minh họa ngắn từ ảnh, `collection.zip` là gói kiểm thử cũ. Bản Studio mới dùng `studio-cover-1.webp` đến `studio-cover-6.webp` và sáu clip `studio-preview-*.mp4` khác nhau, có chuyển động camera nhẹ và watermark. Đây không phải footage Flowframes/Twixtor thương mại. Clip demo là 960×540, 24 FPS, 8 giây. `aurora-720.mp4` là file riêng 1280×720 để thử quyền chất lượng, giá nâng cấp và file đi kèm. ZIP mới `studio-collection.zip` có sample.mp4, blue-hour.mp4 và README. Các file của bản demo trước được giữ nguyên.

AE demo dùng file text ghi rõ không phải preset thực; artwork không được coi là project AE đã kiểm thử. Kích thước/checksum tải lấy từ byte thật; giá demo không phải giá đã chốt.

Tái tạo cover/ZIP bằng `node scripts/prepare-demo.mjs`. Script chỉ tạo video nếu chưa tồn tại; font mặc định Arial trên Windows hoặc DejaVu Sans trên Linux, có thể đặt `WATERMARK_FONT_PATH`. Không dùng các mẫu này thay cho hàng thật khi mở bán.

Tái tạo media Studio mới bằng `node scripts/prepare-studio-demo.mjs`. Script ghi manifest kích thước, không sửa PNG gốc. Font dùng cùng quy tắc như trên.

## Prompt nguyên văn của ba artwork bổ sung

**Kinetic Type:** Use case: ads-marketing. Create an original wide 16:9 digital motion design asset cover for a premium creative asset shop ZENITH MEDIA. This image is for the Kinetic Type sample collection. Swiss typography meets contemporary motion graphics: the large bold condensed word 'MOTION' in creamy white, repeated in a meticulously aligned perspective stack, stretching and bending through deep violet space, subtle lavender geometric panels and a sharply lit chrome sphere. One word only, MOTION. Highly art directed, crisp, commercially polished cover art, tactile paper and chrome surfaces, restrained monochrome lavender palette, striking asymmetrical composition filling frame. No UI, no mock website, no logos, no fake stock watermarks, no extra words.

**Violet:** Use case: stylized-concept. Original premium digital film still for Violet / Frame Collection on a creative media shop. Wide 16:9. Extreme macro photograph of an elegant translucent violet glass iris sculpture with thin ribbed petals, concentric unfolding geometry, small liquid mercury beads nestled in the folds. Delicate milky pale lavender and silver, soft side lighting, deep rich shadows but a predominantly luminous image. Expensive macro lens, photographic depth, physically plausible refractions, crisp precise details. Full bleed. No letters, no typography, no UI, no logos, no watermark.

**Motion Collection:** Use case: stylized-concept. Create an original premium 16:9 cover artwork for The Motion Collection, a demo digital video bundle in a creative marketplace. A surreal cinematic landscape: calm mirror water, stark monolithic polished chrome ring standing upright above the water in the center right, the ring encircles a soft pale lavender moon, distant sculptural mountains in layers of smoky indigo. A small warm sunrise reflection adds a restrained highlight. High-end 3D art direction with fine natural film grain and incredibly detailed physical reflections. Medium-wide cinematic view, airy and refined, beautiful negative space, no text, no logos, no watermark, no UI.
