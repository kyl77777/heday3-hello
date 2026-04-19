import unittest
from pathlib import Path


class LandingStructureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        index_path = Path(__file__).resolve().parents[1] / "index.html"
        cls.html = index_path.read_text(encoding="utf-8")

    def test_required_section_ids_exist(self):
        required_ids = [
            "hero",
            "pain-points",
            "curriculum",
            "offline-benefits",
            "trust",
            "pricing-location",
            "contact",
        ]
        for section_id in required_ids:
            self.assertIn(
                f'id="{section_id}"',
                self.html,
                msg=f"Missing section id: {section_id}",
            )

    def test_required_copy_exists(self):
        self.assertIn("비개발자도 따라오는 쉬운 커리큘럼", self.html)

    def test_required_cta_links_exist(self):
        required_hrefs = [
            'href="tel:0212345678"',
            'href="https://open.kakao.com/o/aiassistedu"',
            'href="#contact"',
        ]
        for href in required_hrefs:
            self.assertIn(href, self.html, msg=f"Missing CTA href: {href}")


if __name__ == "__main__":
    unittest.main()
