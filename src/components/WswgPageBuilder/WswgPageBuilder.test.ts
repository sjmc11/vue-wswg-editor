import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import WswgPageBuilder from "./WswgPageBuilder.vue";

describe("WswgPageBuilder", () => {
   it("renders the placeholder component", () => {
      const wrapper = mount(WswgPageBuilder);

      expect(wrapper.text()).toContain("WswgPageBuilder");
      expect(wrapper.text()).toContain("This is a placeholder component");
   });

   it("renders header slot content when provided", () => {
      const headerContent = "Custom Header Content";
      const wrapper = mount(WswgPageBuilder, {
         slots: {
            header: headerContent,
         },
      });

      expect(wrapper.text()).toContain(headerContent);
   });

   it("renders header slot with HTML content", () => {
      const wrapper = mount(WswgPageBuilder, {
         slots: {
            header: "<div class='custom-header'>Header Title</div>",
         },
      });

      expect(wrapper.find(".custom-header").exists()).toBe(true);
      expect(wrapper.text()).toContain("Header Title");
   });

   it("does not render header slot when not provided", () => {
      const wrapper = mount(WswgPageBuilder);

      // The component should still render without the header slot
      expect(wrapper.text()).toContain("WswgPageBuilder");
      // Header slot should be empty/not present
      expect(wrapper.html()).not.toContain("custom-header");
   });
});
