defmodule Calmdo.Work do
  use Ash.Domain,
    otp_app: :calmdo,
    extensions: [AshPhoenix]

  resources do
    resource Calmdo.Work.Project do
      define :read_projects, action: :read
      define :get_project_by_id, action: :read, get_by: :id
      define :create_project, action: :create
      define :update_project, action: :update
      define :destroy_project, action: :destroy
    end
  end
end
