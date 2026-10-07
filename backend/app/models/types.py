from enum import StrEnum


class FormStatus(StrEnum):
    draft = "draft"
    published = "published"


class QuestionType(StrEnum):
    short_text = "short_text"
    long_text = "long_text"
    multiple_choice = "multiple_choice"
    dropdown = "dropdown"
    email = "email"
    number = "number"
    yes_no = "yes_no"
    rating = "rating"


CHOICE_TYPES = {QuestionType.multiple_choice, QuestionType.dropdown}
