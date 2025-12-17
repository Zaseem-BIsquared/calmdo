defmodule CalmdoWeb.HomeLive.Index do
  use CalmdoWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, socket}
  end

  def render(assigns) do
    ~H"""
    <Layouts.app {assigns}>
      <h1>Home</h1>
    </Layouts.app>
    """
  end
end
