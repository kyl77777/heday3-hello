import unittest
from html.parser import HTMLParser
from pathlib import Path


class TrustHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.review_card_count = 0
        self.faq_item_count = 0

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if attrs_dict.get("data-review-card") == "true":
            self.review_card_count += 1

        classes = set(attrs_dict.get("class", "").split())
        if "faq-item" in classes:
            self.faq_item_count += 1


class TrustContentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        index_path = Path(__file__).resolve().parents[1] / "index.html"
        html = index_path.read_text(encoding="utf-8")
        parser = TrustHTMLParser()
        parser.feed(html)
        cls.review_card_count = parser.review_card_count
        cls.faq_item_count = parser.faq_item_count

    def test_has_at_least_three_review_cards(self):
        self.assertGreaterEqual(
            self.review_card_count,
            3,
            msg="Trust section must include at least 3 review cards with data-review-card=\"true\"",
        )

    def test_has_at_least_three_faq_items(self):
        self.assertGreaterEqual(
            self.faq_item_count,
            3,
            msg="Trust section must include at least 3 FAQ items with class 'faq-item'",
        )


if __name__ == "__main__":
    unittest.main()
