defmodule CalmdoWeb.ProjectLive.FormComponent do
  use CalmdoWeb, :live_component

  alias Calmdo.Work
  alias AshPhoenix.Form

  import CalmdoWeb.Components.Modal

  @impl true
  def update(assigns, socket) do
    socket =
      socket
      |> assign(assigns)
      |> assign_new(:project, fn -> nil end)
      |> assign_new(:action, fn -> :create end)
      |> assign_form()
      |> assign_title()

    {:ok, socket}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div>
      <.modal id={@id} title={@title}>
        <.form for={@form} phx-change="validate" phx-submit="save" phx-target={@myself}>
          <.input field={@form[:name]} type="text" label="Name" />
          <.input
            :if={@action == :update}
            field={@form[:completed]}
            type="checkbox"
            label="Completed"
          />
          <div class="modal-action">
            <.button phx-disable-with="Saving..." variant="primary">Save</.button>
          </div>
        </.form>
      </.modal>
    </div>
    """
  end

  @impl true
  def handle_event("validate", %{"form" => form_params}, socket) do
    socket =
      socket
      |> update(:form, fn form ->
        Form.validate(form, form_params)
      end)

    {:noreply, socket}
  end

  @impl true
  def handle_event("save", %{"form" => form_params}, socket) do
    case Form.submit(socket.assigns.form, params: form_params) do
      {:ok, project} ->
        message =
          case socket.assigns.action do
            :create -> "Project created successfully."
            :update -> "Project updated successfully."
          end

        socket =
          socket
          |> put_flash(:info, message)
          |> push_navigate(to: ~p"/projects/#{project.id}")

        {:noreply, socket}

      {:error, form} ->
        socket =
          socket
          |> put_flash(:error, "There was a problem saving the project.")
          |> assign(:form, form)

        {:noreply, socket}
    end
  end

  defp assign_form(socket) do
    form =
      case socket.assigns.action do
        :create -> Work.form_to_create_project()
        :update -> Work.form_to_update_project(socket.assigns.project)
      end

    assign(socket, :form, to_form(form))
  end

  defp assign_title(socket) do
    case socket.assigns.action do
      :create -> assign(socket, :title, "New Project")
      :update -> assign(socket, :title, "Edit Project")
    end
  end
end
