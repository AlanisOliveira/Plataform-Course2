type Props = {};

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useApiUrl from "@/hooks/useApiUrl";
import { toast } from "sonner";
import { useEffect } from "react";
import BackupManager from "@/components/backup/backup-manager";

const formSchema = z.object({
  url: z
    .string()
    .url("API inválida")
    .min(1, "Informe uma API")
    .max(512, "API longa demais"),
});

export default function SettingsPage({}: Props) {
  const { apiUrl, resetApiUrl, setApiUrl } = useApiUrl();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: apiUrl,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setApiUrl(values.url);
    toast.success("API atualizada com sucesso!");
  }

  useEffect(() => {
    form.setValue("url", apiUrl);
  }, [apiUrl]);
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da plataforma
        </p>
      </div>

      <Separator />

      <div className="max-w-2xl space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Conexão com API</h2>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-start">
                    <FormLabel>API</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ex: http://localhost:5000"
                        type="url"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      Não coloque '/' no final da url
                    </FormDescription>
                  </FormItem>
                )}
              />
              <div className="space-x-4 flex justify-end">
                <Button
                  type="button"
                  onClick={resetApiUrl}
                  variant="outline"
                  className=""
                >
                  Restaurar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </Form>
        </div>

        <Separator />

        <div>
          <h2 className="text-xl font-semibold mb-4">Backup do Banco de Dados</h2>
          <BackupManager />
        </div>
      </div>
    </div>
  );
}
