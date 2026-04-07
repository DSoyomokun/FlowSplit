from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser
from app.core.database import SessionDep
from app.crud.crud_split_template import (
    create_split_template,
    delete_split_template,
    get_split_template,
    get_split_templates_by_user,
    update_split_template,
)
from app.schemas.split_template import (
    SplitTemplateCreate,
    SplitTemplateResponse,
    SplitTemplateUpdate,
)

router = APIRouter(prefix="/split-templates", tags=["split-templates"])


@router.get("", response_model=list[SplitTemplateResponse])
async def list_split_templates(
    session: SessionDep,
    current_user: CurrentUser,
) -> list[SplitTemplateResponse]:
    templates = await get_split_templates_by_user(session, current_user.id)
    return [SplitTemplateResponse.model_validate(t) for t in templates]


@router.post("", response_model=SplitTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_new_split_template(
    session: SessionDep,
    current_user: CurrentUser,
    template_in: SplitTemplateCreate,
) -> SplitTemplateResponse:
    template = await create_split_template(session, current_user.id, template_in)
    await session.commit()
    return SplitTemplateResponse.model_validate(template)


@router.get("/{template_id}", response_model=SplitTemplateResponse)
async def get_split_template_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    template_id: str,
) -> SplitTemplateResponse:
    template = await get_split_template(session, template_id)
    if not template or template.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return SplitTemplateResponse.model_validate(template)


@router.patch("/{template_id}", response_model=SplitTemplateResponse)
async def update_split_template_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    template_id: str,
    template_in: SplitTemplateUpdate,
) -> SplitTemplateResponse:
    template = await get_split_template(session, template_id)
    if not template or template.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    template = await update_split_template(session, template, template_in)
    await session.commit()
    return SplitTemplateResponse.model_validate(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_split_template_by_id(
    session: SessionDep,
    current_user: CurrentUser,
    template_id: str,
) -> None:
    template = await get_split_template(session, template_id)
    if not template or template.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    await delete_split_template(session, template)
    await session.commit()
