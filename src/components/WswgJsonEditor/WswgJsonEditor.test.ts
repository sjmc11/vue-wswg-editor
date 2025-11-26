import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import WswgJsonEditor from "./WswgJsonEditor.vue";

describe("WswgJsonEditor", () => {
   it("renders the placeholder component", () => {
      const wrapper = mount(WswgJsonEditor);

      expect(wrapper.text()).toContain("WswgJsonEditor");
      expect(wrapper.text()).toContain("This is a placeholder component");
   });

   it("renders header slot content when provided", () => {
      const headerContent = "Custom Header Content";
      const wrapper = mount(WswgJsonEditor, {
         slots: {
            header: headerContent,
         },
      });

      expect(wrapper.text()).toContain(headerContent);
   });

   it("renders header slot with HTML content", () => {
      const wrapper = mount(WswgJsonEditor, {
         slots: {
            header: "<div class='custom-header'>Header Title</div>",
         },
      });

      expect(wrapper.find(".custom-header").exists()).toBe(true);
      expect(wrapper.text()).toContain("Header Title");
   });

   it("does not render header slot when not provided", () => {
      const wrapper = mount(WswgJsonEditor);

      // The component should still render without the header slot
      expect(wrapper.text()).toContain("WswgJsonEditor");
      // Header slot should be empty/not present
      expect(wrapper.html()).not.toContain("custom-header");
   });
});
