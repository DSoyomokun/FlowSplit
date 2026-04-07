from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.split_template import SplitTemplate, SplitTemplateItem
from app.schemas.split_template import SplitTemplateCreate, SplitTemplateUpdate


async def _load_template(session: AsyncSession, template_id: str) -> SplitTemplate | None:
    """Fetch a template with items and their buckets eagerly loaded."""
    result = await session.execute(
        select(SplitTemplate)
        .where(SplitTemplate.id == template_id)
        .options(
            selectinload(SplitTemplate.items).selectinload(SplitTemplateItem.bucket)
        )
    )
    return result.scalar_one_or_none()


async def get_split_template(
    session: AsyncSession, template_id: str
) -> SplitTemplate | None:
    return await _load_template(session, template_id)


async def get_split_templates_by_user(
    session: AsyncSession, user_id: str
) -> list[SplitTemplate]:
    result = await session.execute(
        select(SplitTemplate)
        .where(SplitTemplate.user_id == user_id)
        .options(
            selectinload(SplitTemplate.items).selectinload(SplitTemplateItem.bucket)
        )
        .order_by(SplitTemplate.created_at)
    )
    return list(result.scalars().all())


async def create_split_template(
    session: AsyncSession,
    user_id: str,
    template_in: SplitTemplateCreate,
) -> SplitTemplate:
    template = SplitTemplate(user_id=user_id, name=template_in.name)
    session.add(template)
    await session.flush()  # get template.id

    for index, item_in in enumerate(template_in.items):
        item = SplitTemplateItem(
            template_id=template.id,
            bucket_id=item_in.bucket_id,
            allocation_type=item_in.allocation_type.value,
            allocation_value=item_in.allocation_value,
            sort_order=index,
        )
        session.add(item)

    await session.flush()
    return await _load_template(session, template.id)  # type: ignore[return-value]


async def update_split_template(
    session: AsyncSession,
    template: SplitTemplate,
    template_in: SplitTemplateUpdate,
) -> SplitTemplate:
    if template_in.name is not None:
        template.name = template_in.name

    if template_in.items is not None:
        # Replace all items
        for item in list(template.items):
            await session.delete(item)
        await session.flush()

        for index, item_in in enumerate(template_in.items):
            item = SplitTemplateItem(
                template_id=template.id,
                bucket_id=item_in.bucket_id,
                allocation_type=item_in.allocation_type.value,
                allocation_value=item_in.allocation_value,
                sort_order=index,
            )
            session.add(item)

    await session.flush()
    return await _load_template(session, template.id)  # type: ignore[return-value]


async def delete_split_template(
    session: AsyncSession, template: SplitTemplate
) -> None:
    await session.delete(template)
    await session.flush()
