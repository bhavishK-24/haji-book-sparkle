export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string | null;
          booking_date: string;
          created_at: string;
          customer_name: string;
          email: string | null;
          emirate: string;
          id: string;
          notes: string | null;
          phone: string;
          property_type: string | null;
          service: string;
          status: Database["public"]["Enums"]["booking_status"];
          time_slot: string;
          updated_at: string;
          reference: string | null;
          service_id: string | null;
          service_category: string | null;
          variant_id: string | null;
          property_size: string | null;
          furnishing: string | null;
          add_ons: Json;
          requested_start: string | null;
          estimated_minutes: number | null;
          scheduled_end: string | null;
          price_amount: number | null;
          price_currency: string;
          payment_status: string;
          source: string;
          preferred_channel: string;
        };
        Insert: {
          address?: string | null;
          booking_date: string;
          created_at?: string;
          customer_name: string;
          email?: string | null;
          emirate: string;
          id?: string;
          notes?: string | null;
          phone: string;
          property_type?: string | null;
          service: string;
          status?: Database["public"]["Enums"]["booking_status"];
          time_slot: string;
          updated_at?: string;
          reference?: string | null;
          service_id?: string | null;
          service_category?: string | null;
          variant_id?: string | null;
          property_size?: string | null;
          furnishing?: string | null;
          add_ons?: Json;
          requested_start?: string | null;
          estimated_minutes?: number | null;
          scheduled_end?: string | null;
          price_amount?: number | null;
          price_currency?: string;
          payment_status?: string;
          source?: string;
          preferred_channel?: string;
        };
        Update: {
          address?: string | null;
          booking_date?: string;
          created_at?: string;
          customer_name?: string;
          email?: string | null;
          emirate?: string;
          id?: string;
          notes?: string | null;
          phone?: string;
          property_type?: string | null;
          service?: string;
          status?: Database["public"]["Enums"]["booking_status"];
          time_slot?: string;
          updated_at?: string;
          reference?: string | null;
          service_id?: string | null;
          service_category?: string | null;
          variant_id?: string | null;
          property_size?: string | null;
          furnishing?: string | null;
          add_ons?: Json;
          requested_start?: string | null;
          estimated_minutes?: number | null;
          scheduled_end?: string | null;
          price_amount?: number | null;
          price_currency?: string;
          payment_status?: string;
          source?: string;
          preferred_channel?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          attempts: number;
          audience: string;
          booking_id: string | null;
          channel: string;
          created_at: string;
          event: string;
          id: string;
          last_error: string | null;
          payload: Json;
          provider_message_id: string | null;
          recipient: string;
          sent_at: string | null;
          status: string;
        };
        Insert: {
          attempts?: number;
          audience?: string;
          booking_id?: string | null;
          channel: string;
          created_at?: string;
          event: string;
          id?: string;
          last_error?: string | null;
          payload?: Json;
          provider_message_id?: string | null;
          recipient: string;
          sent_at?: string | null;
          status?: string;
        };
        Update: {
          attempts?: number;
          audience?: string;
          booking_id?: string | null;
          channel?: string;
          created_at?: string;
          event?: string;
          id?: string;
          last_error?: string | null;
          payload?: Json;
          provider_message_id?: string | null;
          recipient?: string;
          sent_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_booking_reference: {
        Args: Record<string, never>;
        Returns: string;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "staff";
      booking_status: "new" | "confirmed" | "completed" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
      booking_status: ["new", "confirmed", "completed", "cancelled"],
    },
  },
} as const;
